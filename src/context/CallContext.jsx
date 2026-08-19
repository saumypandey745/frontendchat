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
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const timerRef = useRef(null);

  // Clean up WebRTC peer & streams
  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState('idle');
    setRemoteUser(null);
    setIsMuted(false);
    setIsCamOff(false);
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
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
        setRemoteStream(event.streams[0]);
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
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
    } catch (err) {
      console.error('Failed to get media devices for call:', err);
      cleanupCall();
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!socket || !remoteUser || !pendingOfferRef.current) return;
    const { offer, callType: cType } = pendingOfferRef.current;
    setCallType(cType);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: cType === 'video',
      });
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
      cleanupCall();
    }
  };

  // Decline Incoming Call
  const declineCall = () => {
    if (socket && remoteUser) {
      socket.emit('call-decline', { toUserId: remoteUser._id });
      // Log missed/declined call in DB
      api.post('/calls', {
        receiverId: remoteUser._id,
        type: callType,
        status: 'declined',
        duration: 0,
      });
    }
    cleanupCall();
  };

  // End Call
  const endCall = () => {
    if (socket && remoteUser) {
      socket.emit('call-end', {
        toUserId: remoteUser._id,
        duration: callDuration,
      });
      // Log call entry in DB
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
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  // Socket Signaling Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingOffer = ({ fromUser, offer, callType }) => {
      if (callState !== 'idle') {
        // Busy - decline automatically
        socket.emit('call-decline', { toUserId: fromUser._id });
        return;
      }

      setRemoteUser(fromUser);
      setCallType(callType);
      setCallState('incoming');
      pendingOfferRef.current = { offer, callType };
    };

    const handleCallAnswered = async ({ answer }) => {
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

    const handleCallDeclined = () => {
      alert(`${remoteUser?.name || 'User'} declined the call.`);
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    socket.on('incoming-call-offer', handleIncomingOffer);
    socket.on('call-answered', handleCallAnswered);
    socket.on('remote-ice-candidate', handleIceCandidate);
    socket.on('call-declined', handleCallDeclined);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call-offer', handleIncomingOffer);
      socket.off('call-answered', handleCallAnswered);
      socket.off('remote-ice-candidate', handleIceCandidate);
      socket.off('call-declined', handleCallDeclined);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, callState, remoteUser]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        isMuted,
        isCamOff,
        callDuration,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
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
