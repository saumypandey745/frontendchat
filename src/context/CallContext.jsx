import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import useSocket from '../hooks/useSocket';
import useAuth from '../hooks/useAuth';
import api from '../lib/axios';

const CallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [callType, setCallType] = useState('voice'); // 'voice' | 'video'
  const [remoteUser, setRemoteUser] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCamStream, setIncomingCamStream] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCamOff, setRemoteCamOff] = useState(false);

  const [facingMode, setFacingMode] = useState('user');
  const [callDuration, setCallDuration] = useState(0);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [callEndReason, setCallEndReason] = useState(null); // 'busy' | 'no_answer' | 'declined' | 'disconnected'

  const peerRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const timerRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const localStreamRef = useRef(null);
  const incomingCamStreamRef = useRef(null);

  // Clean up WebRTC peer & streams
  const cleanupCall = (reason = null) => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (incomingCamStreamRef.current) {
      incomingCamStreamRef.current.getTracks().forEach((track) => track.stop());
      incomingCamStreamRef.current = null;
    }
    if (incomingCamStream) {
      incomingCamStream.getTracks().forEach((track) => track.stop());
      setIncomingCamStream(null);
    }

    setRemoteStream(null);
    setCallState('idle');
    setRemoteUser(null);
    setIsMuted(false);
    setIsCamOff(false);
    setRemoteMuted(false);
    setRemoteCamOff(false);
    setFacingMode('user');
    setCallDuration(0);
    setIsMinimized(false);
    setIsReconnecting(false);
    setIsSpeakerOn(false);

    if (reason) {
      setCallEndReason(reason);
      setTimeout(() => setCallEndReason(null), 4000);
    }
  };

  // Start Call Duration Timer
  const startTimer = () => {
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Initialize WebRTC Peer Connection
  const createPeer = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          toUserId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = new MediaStream(event.streams[0].getTracks());
        setRemoteStream(stream);
      }
    };

    // Reconnection & ICE Restart handling
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Connection State]: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsReconnecting(true);

        // Attempt ICE restart
        if (pc.restartIce) {
          pc.restartIce();
        } else {
          pc.createOffer({ iceRestart: true }).then((offer) => {
            pc.setLocalDescription(offer);
            socket?.emit('call-offer', { toUserId: targetUserId, offer, callType, isIceRestart: true });
          }).catch((err) => console.error('ICE restart offer error:', err));
        }

        // Start 15-second grace window timer
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            if (peerRef.current && peerRef.current.connectionState !== 'connected') {
              console.log('Reconnection failed after 15s timeout.');
              cleanupCall('disconnected');
            }
          }, 15000);
        }
      } else if (pc.connectionState === 'connected') {
        setIsReconnecting(false);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }
    };

    peerRef.current = pc;
    return pc;
  };

  // Start Outgoing Call
  const startCall = async (targetUser, type = 'voice') => {
    if (!socket || !targetUser) return;
    setCallType(type);
    setRemoteUser(targetUser);
    setCallState('calling');
    setPermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeer(targetUser._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-offer', {
        toUserId: targetUser._id,
        offer,
        callType: type,
      });

      // 30-Second Ringing Timeout (No answer)
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        if (callState === 'calling') {
          socket.emit('call-end', { toUserId: targetUser._id, duration: 0 });
          api.post('/calls', {
            receiverId: targetUser._id,
            type,
            status: 'missed',
            duration: 0,
          });
          cleanupCall('no_answer');
        }
      }, 30000);
    } catch (err) {
      console.error('Failed to get media devices for call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError({
          type: type === 'video' ? 'camera/microphone' : 'microphone',
          message: `Browser permission to access your ${type === 'video' ? 'camera and microphone' : 'microphone'} was denied. Please allow access in browser site settings.`,
        });
      } else {
        alert(`Could not access ${type === 'video' ? 'camera/microphone' : 'microphone'}. Ensure devices are connected.`);
      }
      cleanupCall();
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!socket || !remoteUser || !pendingOfferRef.current) return;
    const { offer, callType: cType } = pendingOfferRef.current;
    setCallType(cType);
    setPermissionError(null);

    // Stop incoming preview stream before acquiring main stream
    if (incomingCamStreamRef.current) {
      incomingCamStreamRef.current.getTracks().forEach((t) => t.stop());
      incomingCamStreamRef.current = null;
      setIncomingCamStream(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: cType === 'video' ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeer(remoteUser._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call-answer', {
        toUserId: remoteUser._id,
        answer,
      });

      setCallState('connected');
      startTimer();
    } catch (err) {
      console.error('Error accepting call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError({
          type: cType === 'video' ? 'camera/microphone' : 'microphone',
          message: `Browser permission to access your ${cType === 'video' ? 'camera and microphone' : 'microphone'} was denied. Please allow access in browser site settings.`,
        });
      } else {
        alert('Could not access media devices to answer the call.');
      }
      cleanupCall();
    }
  };

  // Decline Incoming Call
  const declineCall = (reason = 'declined') => {
    if (socket && remoteUser) {
      socket.emit('call-decline', { toUserId: remoteUser._id, reason });
      api.post('/calls', {
        receiverId: remoteUser._id,
        type: callType,
        status: 'declined',
        duration: 0,
      });
    }
    cleanupCall(reason);
  };

  // End Call
  const endCall = () => {
    if (socket && remoteUser) {
      socket.emit('call-end', {
        toUserId: remoteUser._id,
        duration: callDuration,
      });
      api.post('/calls', {
        receiverId: remoteUser._id,
        type: callType,
        status: callDuration > 0 ? 'answered' : 'missed',
        duration: callDuration,
      });
    }
    cleanupCall();
  };

  // Toggle Mute Mic
  const toggleMute = () => {
    const activeStream = localStreamRef.current || localStream;
    if (activeStream) {
      const audioTrack = activeStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsMuted(newMutedState);

        if (socket && remoteUser) {
          socket.emit('media-state-change', {
            toUserId: remoteUser._id,
            isMuted: newMutedState,
            isCamOff,
          });
        }
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    const activeStream = localStreamRef.current || localStream;
    if (activeStream) {
      const videoTrack = activeStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newCamState = !videoTrack.enabled;
        setIsCamOff(newCamState);

        if (socket && remoteUser) {
          socket.emit('media-state-change', {
            toUserId: remoteUser._id,
            isMuted,
            isCamOff: newCamState,
          });
        }
      }
    }
  };

  // Switch Camera (Front / Back facing mode)
  const switchCamera = async () => {
    if (callType !== 'video' || !peerRef.current) return;
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: nextFacingMode },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const activeStream = localStreamRef.current || localStream;

      if (activeStream) {
        const oldVideoTrack = activeStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          activeStream.removeTrack(oldVideoTrack);
        }
        if (newVideoTrack) {
          newVideoTrack.enabled = !isCamOff;
          activeStream.addTrack(newVideoTrack);
        }
        localStreamRef.current = activeStream;
        setLocalStream(new MediaStream(activeStream.getTracks()));
      }

      // Replace track on WebRTC peer connection senders
      if (peerRef.current && newVideoTrack) {
        const senders = peerRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      setFacingMode(nextFacingMode);
    } catch (err) {
      console.error('Failed to switch camera:', err);
    }
  };

  // Speaker Output Toggle (HTML5 setSinkId)
  const toggleSpeaker = async (mediaRef) => {
    if (!mediaRef?.current) return;
    try {
      if (typeof mediaRef.current.setSinkId === 'function') {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
        if (audioOutputs.length > 1) {
          const nextDevice = audioOutputs[isSpeakerOn ? 0 : 1];
          await mediaRef.current.setSinkId(nextDevice.deviceId);
        }
      }
      setIsSpeakerOn(!isSpeakerOn);
    } catch (e) {
      console.error('Error toggling speaker sink:', e);
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  // Minimize / Maximize call
  const minimizeCall = () => setIsMinimized(true);
  const maximizeCall = () => setIsMinimized(false);

  // Clear permission error
  const clearPermissionError = () => setPermissionError(null);

  // Socket Signaling Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingOffer = async ({ fromUser, offer, callType: cType }) => {
      // Busy check: recipient already on a call
      if (callState !== 'idle') {
        socket.emit('call-decline', { toUserId: fromUser._id, reason: 'busy' });
        return;
      }

      setRemoteUser(fromUser);
      setCallType(cType);
      setCallState('incoming');
      pendingOfferRef.current = { offer, callType: cType };

      // Optional incoming video self-preview before accept (non-blocking)
      if (cType === 'video') {
        try {
          const previewStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          incomingCamStreamRef.current = previewStream;
          setIncomingCamStream(previewStream);
        } catch (e) {
          // Ignore preview permission errors prior to accept
        }
      }
    };

    const handleCallAnswered = async ({ answer }) => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState('connected');
        startTimer();
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerRef.current && candidate) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    };

    const handleCallDeclined = ({ reason } = {}) => {
      const declReason = reason === 'busy' ? 'busy' : 'declined';
      cleanupCall(declReason);
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    const handleMediaStateChange = ({ isMuted: rMuted, isCamOff: rCamOff }) => {
      if (rMuted !== undefined) setRemoteMuted(rMuted);
      if (rCamOff !== undefined) setRemoteCamOff(rCamOff);
    };

    socket.on('incoming-call-offer', handleIncomingOffer);
    socket.on('call-answered', handleCallAnswered);
    socket.on('remote-ice-candidate', handleIceCandidate);
    socket.on('call-declined', handleCallDeclined);
    socket.on('call-ended', handleCallEnded);
    socket.on('media-state-change', handleMediaStateChange);

    return () => {
      socket.off('incoming-call-offer', handleIncomingOffer);
      socket.off('call-answered', handleCallAnswered);
      socket.off('remote-ice-candidate', handleIceCandidate);
      socket.off('call-declined', handleCallDeclined);
      socket.off('call-ended', handleCallEnded);
      socket.off('media-state-change', handleMediaStateChange);
    };
  }, [socket, callState]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        incomingCamStream,
        isMuted,
        isCamOff,
        remoteMuted,
        remoteCamOff,
        facingMode,
        callDuration,
        isMinimized,
        isReconnecting,
        isSpeakerOn,
        permissionError,
        callEndReason,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
        switchCamera,
        toggleSpeaker,
        minimizeCall,
        maximizeCall,
        clearPermissionError,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
