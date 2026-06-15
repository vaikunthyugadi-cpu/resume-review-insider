"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notification = { id: string; title: string; message: string; link: string | null; read_at: string | null; created_at: string };

export function NotificationCenter({ initialItems }: { initialItems: Notification[] }) {
  const [items, setItems] = useState(initialItems);
  if (!items.length) return null;

  async function markRead(id: string) {
    setItems(current => current.map(item => item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item));
    await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }

  return <section className="notification-panel" aria-label="Recent notifications">
    <div className="notification-heading"><div><span className="eyebrow">Recent activity</span><h2>Notifications</h2></div><span>{items.filter(item => !item.read_at).length} new</span></div>
    <div className="notification-list">{items.slice(0, 5).map(item => {
      const body = <><span className={item.read_at ? "notification-dot read" : "notification-dot"}></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></div></>;
      return item.link ? <Link className="notification-item" href={item.link} key={item.id} onClick={() => void markRead(item.id)}>{body}</Link> : <button className="notification-item" type="button" key={item.id} onClick={() => void markRead(item.id)}>{body}</button>;
    })}</div>
  </section>;
}
