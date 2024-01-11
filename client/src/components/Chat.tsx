'use client'
import React, { useState, useEffect, useRef } from 'react';
import MySocket from './MySocket';

const mySocket = new MySocket();
const Chat = () => {
    const [chatView, setChatView] = useState(false);
    const [username, setUsername] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>();
    const connectionRef = useRef<boolean>(false);
    useEffect(() => {
        const callback = (data: any[]) => {
            setUsers([...data] as any);
        }
        mySocket.setUserDataChange(callback);
    }, []);
    useEffect(() => {
        if (!connectionRef.current) {
            const sessionID = localStorage.getItem('sessionID');
            if (sessionID) {
                mySocket.connectToSocket(sessionID);
                setChatView(true);
            }
        }
    }, [])
    useEffect(() => {
        if (selectedUser) {
            mySocket.setSelectedUser(selectedUser.userID);
        }
    }, [selectedUser]);
    return (
        <>
            {!chatView ? (
                <div className='flex h-screen items-center justify-center gap-3'>
                    <input className='border-solid border-2 p-3' placeholder='Username!' name='username' onChange={(event) => setUsername(event.target.value)} />
                    <button className='bg-purple-700 text-white rounded p-3' onClick={() => {
                        setChatView(true);
                        mySocket.onUsernameSelection(username);
                    }}>Join</button>
                </div>
            ) : (
                <div className='grid grid-flow-col h-screen'>
                    <div className='bg-purple-700 p-4 flex flex-col gap-4'>
                        {
                            users && users.map((user: any) => {
                                return (
                                    <div className='flex gap-2'>
                                        <button className={`flex flex-col gap-1 p-3 w-full ${selectedUser && selectedUser.userID === user.userID && 'bg-purple-800'
                                            }`} onClick={() => setSelectedUser(user)}>
                                            <div className='text-white'>{user.username} {user.self && '(Me)'}</div>
                                            <div className='flex gap-2 items-center'>
                                                <div className='rounded h-2 w-2 bg-green-500'></div>
                                                <div>online</div>
                                            </div>
                                        </button>
                                        {
                                            user.hasNewMessages && (
                                                <div className='rounded h-4 w-4 bg-red-500 self-center'></div>
                                            )
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className='flex flex-col col-span-4'>
                        <div className='p-6 border-solid border-b-2'>
                            {
                                selectedUser ? (
                                    <div className='flex gap-2 items-center'>
                                        <div className='rounded h-2 w-2 bg-green-500'></div>
                                        <div>{selectedUser.username}</div>
                                    </div>) : (
                                    <div>Select a user to start chat!</div>
                                )
                            }
                        </div>
                        <div className='p-6'>
                            {
                                selectedUser && users && users.map((user: any) => {
                                    if (user.userID === selectedUser.userID) {
                                        return (
                                            <div>
                                                {
                                                    user.messages && user.messages.map((message: any) => {
                                                        return (
                                                            <div className={`flex flex-col gap-1 mb-6 ${message.fromSelf ? 'text-green-500' : 'text-red-500'}`}>
                                                                <div>{message.fromSelf ? '(Me)' : selectedUser.username}</div>
                                                                <div>{message.content}</div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        )
                                    }
                                })
                            }
                            <div className='flex gap-1'>
                                <textarea onChange={(event) => setMessage(event.target.value)} value={message} className='w-full h-24 border-solid border-2 border-gray-300 rounded p-2' placeholder='Enter your message!'></textarea>
                                <button onClick={() => {
                                    mySocket.onMessage(message)
                                    setMessage('');
                                }} className='bg-purple-700 text-white rounded p-2 h-max'>Send</button>
                            </div>
                        </div>
                    </div>
                </div >
            )
            }
        </>
    )
}

export default Chat
