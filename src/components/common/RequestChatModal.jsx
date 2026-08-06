import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  TextField, Button, CircularProgress, Chip, Paper, Avatar, Divider, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import StatusChip from './StatusChip';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

const getRoleColor = (role) => {
  switch (role) {
    case 'ADMIN': return '#9B2C2C';
    case 'APPROVER': return '#2F855A';
    case 'MONITOR': return '#2B6CB0';
    case 'AGENCY': return '#D69E2E';
    case 'BRANCH_REQUESTER': return '#805AD5';
    default: return '#4A5568';
  }
};

const getTargetRoleName = (status) => {
  switch (status) {
    case 'SUBMITTED': return 'Department Approver';
    case 'APPROVED':
    case 'PARTIALLY_DELIVERED': return 'Delivery Agency';
    case 'DELIVERED': return 'Branch Requester';
    default: return 'Department Monitor';
  }
};

const RequestChatModal = ({ open, onClose, request, onRead }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && request?.id) {
      fetchMessages();
    } else {
      setMessages([]);
      setNewMessage('');
      setError('');
    }
  }, [open, request]);

  const fetchMessages = async () => {
    if (!request?.id) return;
    setLoading(true);
    try {
      const res = await chatService.getChatMessages(request.id);
      if (res.success) {
        const loadedMsgs = res.data || [];
        setMessages(loadedMsgs);
        if (user?.id) {
          chatService.markChatAsRead(user.id, request.id, loadedMsgs.length);
          if (onRead) onRead(request.id, loadedMsgs.length);
        }
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
      setError('Unable to load chat messages');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !request?.id) return;
    setSending(true);
    setError('');
    try {
      const res = await chatService.sendChatMessage(request.id, newMessage.trim());
      if (res.success) {
        const updated = [...messages, res.data];
        setMessages(updated);
        setNewMessage('');
        if (user?.id) {
          chatService.markChatAsRead(user.id, request.id, updated.length);
          if (onRead) onRead(request.id, updated.length);
        }
        scrollToBottom();
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon sx={{ color: '#63B3ED' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Request Chat: {request?.requestNo}
            </Typography>
          </Box>
          {request?.status && <StatusChip status={request.status} />}
        </Box>
        {request && (
          <Typography variant="caption" sx={{ color: '#A0AEC0', display: 'block', mt: 0.5 }}>
            Department: <strong>{request.department || 'GENERAL'}</strong> | Branch: <strong>{request.branch?.name || '-'}</strong> | Applicant: <strong>{request.applicantName || request.requester?.name || '-'}</strong>
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: '#F7FAFC' }}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, backgroundColor: '#EBF8FF', borderColor: '#BEE3F8', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#2B6CB0', fontWeight: 600 }}>
            💬 Messages in this status auto-target the <strong>{getTargetRoleName(request?.status)}</strong>.
          </Typography>
        </Paper>

        <Box sx={{ height: 340, overflowY: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={32} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#A0AEC0' }}>
              <Typography variant="body2">No chat messages yet.</Typography>
              <Typography variant="caption">Send a message below to start communicating with the status owner.</Typography>
            </Box>
          ) : (
            messages.map((msg) => {
              const isMe = Number(msg.senderId) === Number(user?.id) || (user?.name && msg.senderName === user.name);
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    maxWidth: '85%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: isMe ? '#2B6CB0' : getRoleColor(msg.senderRole),
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {isMe ? (user?.name?.[0] || 'Y') : (msg.senderName?.[0] || 'U')}
                  </Avatar>
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: isMe ? '#2B6CB0' : '#FFFFFF',
                      color: isMe ? '#FFFFFF' : '#2D3748',
                      borderColor: isMe ? '#2B6CB0' : '#E2E8F0',
                      borderTopRightRadius: isMe ? 0 : 8,
                      borderTopLeftRadius: isMe ? 8 : 0,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isMe ? '#FFFFFF' : '#2D3748' }}>
                          {isMe ? 'You' : msg.senderName}
                        </Typography>
                        <Chip
                          label={msg.senderRole}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            backgroundColor: isMe ? '#4299E1' : getRoleColor(msg.senderRole),
                            color: '#FFF',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: isMe ? '#E2E8F0' : '#A0AEC0' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: isMe ? '#FFFFFF' : '#4A5568', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {msg.message}
                    </Typography>
                  </Paper>
                </Box>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <form onSubmit={handleSend} style={{ width: '100%', display: 'flex', gap: '8px' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={sending || !newMessage.trim()}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          >
            Send
          </Button>
        </form>
      </DialogActions>
    </Dialog>
  );
};

export default RequestChatModal;
