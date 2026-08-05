"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AudioViewer({ title, url }: { title: string; url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-kufam text-xl text-foreground">{title}</h2>
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="space-y-4 rounded-3xl border border-border bg-background/80 p-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label={playing ? "إيقاف" : "تشغيل"}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = value;
                setCurrent(value);
              }}
              className="w-full accent-primary"
              aria-label="الخط الزمني"
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground" dir="ltr">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (audioRef.current) audioRef.current.muted = next;
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label={muted ? "إلغاء كتم الصوت" : "كتم الصوت"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              setMuted(value === 0);
              if (audioRef.current) {
                audioRef.current.volume = value;
                audioRef.current.muted = value === 0;
              }
            }}
            className="w-32 accent-primary"
            aria-label="مستوى الصوت"
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}
