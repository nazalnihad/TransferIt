import React from "react";
import {Peer} from "peerjs";
import { useState, useEffect,useRef } from "react";

const Recieve = () => {
    const [peer,setPeer] = useState('Conecting...');
    const[message, setMessage] = useState('');
    const peerRef = useRef(null);
    
    useEffect(() =>{
        peerRef.current = new Peer();
        peerRef.current.on('open', function(id) {
            console.log('My peer ID is: ' + id);
            setPeer(id);
          });
          
          peerRef.current.on('connection', (conn) => {
            console.log('Connection received from: ' + conn.peer);
            conn.on('data', (data) => {
                console.log('Received data:', data);
                setMessage(data);
            });
            conn.on('error', (err) => {
                console.error('Connection error:', err);
            });
        }
        );

          return () => {
            peerRef.current.destroy();
          }
    },[])

    

    return (
        <div className='text-center'>
            <h1>Recieve</h1>
            <div>Your ID is {peer}</div>
            <div className="m-5 p-5 border-4 rounded border-indigo-500">
                <h2>Messages</h2>
                <p>{message}</p>
            </div>
        </div>
    )
}
export default Recieve;