import React from "react";
import {Peer} from "peerjs";
import { useState, useEffect,useRef } from "react";

const Send = () => {
    const [peer,setPeer] = useState('Conecting...');
    const [recieverId, setRecieverId] = useState('');
    const [message, setMessage] = useState('');

        const peerRef = useRef(null);
        
        useEffect(() =>{
            peerRef.current = new Peer();
            peerRef.current.on('open', function(id) {
                console.log('My peer ID is: ' + id);
                setPeer(id);
              });
            
              return () => {
                peerRef.current.destroy();
              }
        },[])

    const handleConnect = () => {
        if (recieverId) {
            const conn = peerRef.current.connect(recieverId);
            conn.on('open', () => {
                console.log('Connected to ' + recieverId);
                conn.send('Hello from ' + peerRef.current.id + ': ' + message);
            });
            conn.on('error', (err) => {
                console.error('Connection error:', err);
            });
        } else {
            alert('Please enter a valid peer ID');
        }
    }

    return (
        <div className='text-center'> 
            <h1>Send</h1>
            <button>Send</button>
            <div>Connected to {}</div>
            <div>
            <input type="text" className="p-5" value={message} onChange={(e)=>{setMessage(e.target.value)}}></input>
            <div>
            <input type="text" className="p-5 border-4 rounded border-indigo-500" value={recieverId} onChange={(e)=>setRecieverId(e.target.value)}></input>
            <button className="m-3 p-5 bg-blue-500 text-white px-4 py-2 rounded" onClick={handleConnect}>Connect</button>
            </div>
            </div>
        </div>
    )
}
export default Send;