import React, { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext'; // Assumes you have an AuthContext
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { getApiUrl, getWsUrl, API_ENDPOINTS } from '../config/apiConfig';

const ChatScreen = () => {
  const { user, token, loading } = useContext(AuthContext); // user: { id, username, is_admin }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const ws = useRef(null);
  const flatListRef = useRef(null);
  const adminUsername = 'admin'; // Change if your admin username is different
  const navigation = useNavigation();

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }
  if (!user || !token) {
    return <Text style={{ textAlign: 'center', marginTop: 40 }}>You must be logged in to use chat.</Text>;
  }

  // Room name: room_<user_id>_admin
  const roomName = `room_${user.id}_admin`;

  useEffect(() => {
    fetchChatHistory();
    connectWebSocket();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/chat/history/${roomName}/`), {
        headers: { Authorization: `Bearer ${token}` }, // Try 'Bearer' first
      });
      if (res.status === 401) {
        // Try with 'Token' prefix if 'Bearer' fails
        const res2 = await fetch(getApiUrl(`/api/chat/history/${roomName}/`), {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await res2.json();
        setMessages(data);
        setLoadingMessages(false);
        const ids = data.filter(m => !m.read_by?.includes(user.username)).map(m => m.id);
        if (ids.length) markMessagesRead(ids);
        return;
      }
      const data = await res.json();
      setMessages(data);
      setLoadingMessages(false);
      const ids = data.filter(m => !m.read_by?.includes(user.username)).map(m => m.id);
      if (ids.length) markMessagesRead(ids);
    } catch (err) {
      setLoadingMessages(false);
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    if (!token) {
      console.log('No token available for WebSocket connection');
      return;
    }
    ws.current = new WebSocket(getWsUrl(`/ws/chat/${roomName}/?token=${token}`));
    ws.current.onopen = () => { console.log('WebSocket opened'); };
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'typing') {
        handleTypingIndicator(data);
      } else if (data.id) {
        // Remove optimistic message if present
        setMessages(prev => {
          const filtered = prev.filter(m => !(typeof m.id === 'string' && m.id.startsWith('temp-') && m.message === data.message));
          return [...filtered, data];
        });
      } else if (data.message && data.message.id) {
        setMessages(prev => {
          const filtered = prev.filter(m => !(typeof m.id === 'string' && m.id.startsWith('temp-') && m.message === data.message.message));
          return [...filtered, data.message];
        });
      }
    };
    ws.current.onerror = (e) => { console.log('WebSocket error', e); };
    ws.current.onclose = (e) => { console.log('WebSocket closed', e); };
  };

  // Send message
  const sendMessage = () => {
    if (input.trim() && ws.current && ws.current.readyState === 1) {
      console.log('Sending message:', input);
      // Optimistically add the message to the chat
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        user: user.username,
        room: roomName,
        message: input,
        timestamp: new Date().toISOString(),
        // Optionally add other fields as needed
      };
      setMessages(prev => [...prev, optimisticMsg]);
      ws.current.send(JSON.stringify({ message: input }));
      setInput('');
    } else {
      console.log('WebSocket not ready:', ws.current?.readyState);
    }
  };

  // Typing indicator
  const handleTyping = (isTyping) => {
    if (ws.current && ws.current.readyState === 1) {
      ws.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  };
  const handleTypingIndicator = (data) => {
    setTypingUsers(prev => {
      if (data.is_typing) {
        if (!prev.includes(data.user_id)) return [...prev, data.user_id];
      } else {
        return prev.filter(id => id !== data.user_id);
      }
      return prev;
    });
  };

  // Mark messages as read
  const markMessagesRead = async (ids) => {
    try {
      let res = await fetch(`${BACKEND_URL}/api/chat/mark-read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_ids: ids }),
      });
      if (res.status === 401) {
        // Try with 'Token' prefix if 'Bearer' fails
        res = await fetch(`${BACKEND_URL}/api/chat/mark-read/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ message_ids: ids }),
        });
      }
    } catch {}
  };

  // Render message
  const renderItem = ({ item }) => (
    <View style={[
      styles.bubble,
      item.user === user.username ? styles.myBubble : styles.otherBubble
    ]}>
      <Text style={[styles.bubbleUser, item.user === user.username && styles.bubbleUserMe]}>{item.user === user.username ? 'You' : item.user}</Text>
      <Text style={styles.bubbleText}>{item.message}</Text>
      <Text style={[styles.bubbleTime, item.user === user.username && styles.bubbleTimeMe]}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      {item.read_by && item.read_by.includes(adminUsername) && (
        <Ionicons name="checkmark-done" size={14} color="#ff9800" style={styles.readReceiptIcon} />
      )}
    </View>
  );

  return (
    <SafeAreaViewContext style={{ flex: 1, backgroundColor: '#fff' }} edges={["top","left","right"]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerContentRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backArrow, {marginLeft: -12, marginRight: 2}]}> 
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat with Admin</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.callIcon} onPress={() => { /* Add call functionality here */ }}>
            <Ionicons name="call-outline" size={24} color="#FF9800" />
          </TouchableOpacity>
        </View>
      </View>
      {loadingMessages ? <ActivityIndicator /> : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messagesContainer}
        />
      )}
      {typingUsers.length > 0 && (
        <Text style={styles.typingIndicator}>Admin is typing...</Text>
      )}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={text => {
            setInput(text);
            handleTyping(text.length > 0);
          }}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: input.trim() ? '#ff9800' : '#ffd699' }]} onPress={sendMessage} disabled={!input.trim()}>
          <Ionicons name="send" size={22} color={input.trim() ? '#fff' : '#bbb'} />
        </TouchableOpacity>
      </View>
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  backArrow: {
    marginRight: 4,
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 4,
  },
  bubble: {
    maxWidth: '80%',
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff9800',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bubbleUser: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
    fontWeight: '500',
  },
  bubbleUserMe: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bubbleText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  bubbleTime: {
    fontSize: 10,
    color: '#aaa',
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: '#fff',
    fontWeight: '500',
  },
  readReceiptIcon: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  typingIndicator: {
    fontStyle: 'italic',
    color: '#888',
    marginLeft: 16,
    marginBottom: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222',
    marginRight: 8,
  },
  sendButton: {
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    marginLeft: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen; 