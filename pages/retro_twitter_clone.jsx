import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase init
const supabase = createClient("https://pzxkzsuiakuulovaebhu.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6eGt6c3VpYWt1dWxvdmFlYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzU2NTEsImV4cCI6MjA3MDkxMTY1MX0.a3HezuTISyMoC7fSisnE8e6RM6F_Jo-u-16pQ9v3Olk");

export default function RetroTwitter() {
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState("");
  const [gifUrl, setGifUrl] = useState("");

  // Auth state listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    fetchTweets();
  }, []);

  async function fetchTweets() {
    let { data } = await supabase
      .from("tweets")
      .select("* , replies(*), votes(count, type)")
      .order("created_at", { ascending: false });
    setTweets(data || []);
  }

  async function postTweet() {
    if (!content.trim()) return;
    await supabase.from("tweets").insert({
      content,
      gif_url: gifUrl,
      user_id: user.id,
    });
    setContent("");
    setGifUrl("");
    fetchTweets();
  }

  async function replyTweet(tweetId, replyText) {
    await supabase.from("replies").insert({
      tweet_id: tweetId,
      content: replyText,
      user_id: user.id,
    });
    fetchTweets();
  }

  async function voteTweet(tweetId, type) {
    await supabase.from("votes").insert({ tweet_id: tweetId, type, user_id: user.id });
    fetchTweets();
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div style={{ fontFamily: "Verdana", background: "#f0f0f0", color: "black", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav style={{ background: "#3399ff", padding: "10px", display: "flex", gap: "20px" }}>
        <button>🏠 Home</button>
        <button>👤 Profile</button>
        <button>👥 Friends</button>
      </nav>

      {/* Post box */}
      <div style={{ padding: "20px", background: "#fff", margin: "20px", border: "2px solid #ccc" }}>
        <textarea
          maxLength={400}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening? (max 400 chars)"
          style={{ width: "100%", height: "80px" }}
        />
        <input
          type="text"
          value={gifUrl}
          onChange={(e) => setGifUrl(e.target.value)}
          placeholder="GIF URL (optional)"
          style={{ width: "100%", marginTop: "5px" }}
        />
        <button onClick={postTweet} style={{ marginTop: "10px", background: "#3399ff", color: "white", padding: "5px 10px" }}>Post</button>
      </div>

      {/* Tweets */}
      <div style={{ padding: "20px" }}>
        {tweets.map((t) => (
          <div key={t.id} style={{ border: "1px solid #999", marginBottom: "15px", padding: "10px", background: "white" }}>
            <p>{t.content}</p>
            {t.gif_url && <img src={t.gif_url} alt="gif" style={{ maxWidth: "200px" }} />}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => voteTweet(t.id, "up")}>👍 {t.votes?.filter(v=>v.type==='up').length || 0}</button>
              <button onClick={() => voteTweet(t.id, "down")}>👎 {t.votes?.filter(v=>v.type==='down').length || 0}</button>
            </div>

            {/* Replies */}
            <div style={{ marginTop: "10px", paddingLeft: "20px", borderLeft: "2px solid #ccc" }}>
              {t.replies?.map((r) => (
                <p key={r.id}>↳ {r.content}</p>
              ))}
              <ReplyBox onReply={(txt) => replyTweet(t.id, txt)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  async function handleAuth() {
    if (mode === "login") {
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      await supabase.auth.signUp({ email, password });
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Verdana" }}>
      <h2>Retro Twitter Login</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><br />
      <button onClick={handleAuth}>{mode === "login" ? "Login" : "Register"}</button>
      <p onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ cursor: "pointer", color: "blue" }}>
        {mode === "login" ? "No account? Register" : "Have an account? Login"}
      </p>
    </div>
  );
}

function ReplyBox({ onReply }) {
  const [text, setText] = useState("");
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." />
      <button onClick={() => { onReply(text); setText(""); }}>Reply</button>
    </div>
  );
}
