"use client";
import { useEffect, useState } from 'react';

export function usePersistentCollection<T extends { id: string }>(key:string,initial:T[]){const[items,setItems]=useState<T[]>(initial);const[ready,setReady]=useState(false);useEffect(()=>{try{const value=localStorage.getItem(key);if(value)setItems(JSON.parse(value) as T[])}finally{setReady(true)}},[key]);useEffect(()=>{if(ready)localStorage.setItem(key,JSON.stringify(items))},[items,key,ready]);const create=(item:Omit<T,'id'>)=>setItems(p=>[{...item,id:`${key}-${Date.now()}`} as T,...p]);const update=(id:string,changes:Partial<T>)=>setItems(p=>p.map(item=>item.id===id?{...item,...changes}:item));const remove=(id:string)=>setItems(p=>p.filter(item=>item.id!==id));return{items,create,update,remove,setItems};}
