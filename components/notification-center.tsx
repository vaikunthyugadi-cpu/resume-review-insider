"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notification = { id: string; title: string; message: string; link: string | null; read_at: string | null; created_at: string };

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function NotificationCenter({ initialItems }: { initialItems: Notification[] }) {
  const [items, setItems] = useState(initialItems);
  if (!items.length) return null;

  async function markRead(id: string) {
    const readAt = new Date().toISOString();
    const previous = items;
    setItems(current => current.map(item => item.id === id ? { ...item, read_at: item.read_at || readAt } : item));
    const { error } = await createClient().from("notifications").update({ read_at: readAt }).eq("id", id);
    if (error) setItems(previous);
  }

  return <section className="notification-panel" aria-label="Recent notifications">
    <div className="notification-heading"><div><span className="eyebrow">Recent activity</span><h2>Notifications</h2></div><span>{items.filter(item => !item.read_at).length} new</span></div>
    <div className="notification-list">{items.slice(0, 5).map(item => {
      const body = <><span className={item.read_at ? "notification-dot read" : "notification-dot"}></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatNotificationTime(item.created_at)} UTC</small></div></>;
      return item.link ? <Link className="notification-item" href={item.link} key={item.id} onClick={() => void markRead(item.id)}>{body}</Link> : <button className="notification-item" type="button" key={item.id} onClick={() => void markRead(item.id)}>{body}</button>;
    })}</div>
  </section>;
}
