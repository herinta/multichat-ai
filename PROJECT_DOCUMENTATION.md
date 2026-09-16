# Multi-AI Project Documentation & Handover Guide

> **Catatan untuk Sesi Berikutnya**: Dokumen ini adalah *single source of truth* dari seluruh fitur, arsitektur, skema database, perbaikan bug, dan status terkini aplikasi **Multi-AI**. Baca dokumen ini terlebih dahulu di awal sesi agar tidak perlu menganalisis codebase dari nol.

---

## 1. Project Overview & Tech Stack

**Multi-AI** adalah aplikasi web modern berbasis Next.js App Router yang memungkinkan pengguna berinteraksi dengan banyak karakter AI (*agents*) baik dalam ruang obrolan privat (1-on-1) maupun obrolan grup (*multi-agent group chat*). Karakter AI memiliki memori jangka panjang, memori lintas room, kepribadian santai khas manusia, kemampuan memulai percakapan spontan (*chat duluan*), dan pertahanan anti-prompt injection yang merespon layaknya manusia bingung.

### Tech Stack
* **Frontend**: Next.js 16.3 (Turbopack, App Router), React 19, Tailwind CSS 4
* **Backend API**: Next.js Route Handlers (`/api/chat`, `/api/chat/proactive`, `/api/memory/consolidate`, `/api/agent-likes`)
* **Database & Auth**: Supabase Database (PostgreSQL), Supabase Auth, Supabase Realtime
* **AI Provider**: Google Generative AI SDK (`gemini-3.5-flash-lite`)
* **Image & Avatar Provider**: Pollinations.ai (Gratis, tanpa API key)
* **Markdown Rendering**: `react-markdown`, `remark-gfm`, `react-syntax-highlighter` (One Dark)

---

## 2. Directory & Architecture Structure

```
d:\Project\multi-ai\
├── app\
│   ├── api\
│   │   ├── agent-likes\route.ts       # Like / Unlike agent publik
│   │   ├── chat\
│   │   │   ├── route.ts               # Core chat engine, routing, memory, anti-prompt injection
│   │   │   └── proactive\route.ts     # Engine chat duluan spontan + follow-up agenda
│   │   └── memory\
│   │       └── consolidate\route.ts   # Auto-summarize pesan > 3 hari ke long-term memory
│   ├── landing\page.tsx               # Rute mandiri untuk Landing Page (/landing)
│   ├── login\page.tsx                 # Halaman Masuk / Daftar Akun (Tab Switcher)
│   ├── register\page.tsx              # Rute mandiri untuk Pendaftaran Akun (/register)
│   ├── layout.tsx                     # Root layout + ToastProvider
│   └── page.tsx                       # Async Server Component (render LandingPage instan tanpa loading jika belum login, atau DashboardClient jika login)
├── components\
│   ├── Dashboard\
│   │   └── DashboardClient.tsx        # Dashboard klien interaktif untuk pengguna terautentikasi
│   ├── Landing\
│   │   └── LandingPage.tsx            # Modern Blue Glassmorphism Landing Page (Hero, Mockups, Voice Preview, Customizer)
│   ├── Chat\
│   │   ├── ChatArea.tsx               # Area chat, Markdown bubble, audio/voice, tombol Chat Duluan & Export
│   │   ├── ContactsView.tsx           # Daftar kontak AI, tombol publish ke Explore, start chat
│   │   ├── ExploreView.tsx            # Komunitas publik AI, like/unlike ❤️, clone/start chat
│   │   ├── GroupsView.tsx             # Manajemen room obrolan grup
│   │   ├── InfoPanel.tsx              # Sidebar detail room, edit persona, tema, tambah member
│   │   ├── NewChatModal.tsx           # Modal buat kontak baru / grup baru + AI Avatar Generator
│   │   ├── ProfileView.tsx            # Tab Profil: Karakter saya, Karakter yang disukai, Kelola Persona, Tombol Log Out
│   │   └── Sidebar.tsx                # Daftar chat recent, live search, unread badge, filter, Tombol Log Out
│   └── Modern\
│       ├── Bubble.tsx                 # Gelembung chat modern dengan avatar dan quote reply
│       ├── Button.tsx                 # Komponen button standar
│       ├── Modal.tsx                  # Komponen modal dialog
│       ├── SettingsModal.tsx          # Modal pengaturan user (muted words, global theme, Tombol Keluar dari Akun)
│       └── Toast.tsx                  # Sistem Custom Toast (Glassmorphism, progress timer) & Custom Confirm Modal (pengganti native alert/confirm)
├── hooks\
│   ├── useChat.ts                     # Hook pengirim pesan, realtime sync, inter-AI reply, /imagine
│   ├── useDashboardData.ts            # Hook data dashboard + handleLogout (redirect ke Landing Page)
│   ├── useProactiveChat.ts            # Hook background heartbeat chat duluan + multi-tab mutex lock
│   └── useTypewriter.ts               # Efek animasi ketik teks AI
├── types\
│   └── chat.ts                        # Definisi tipe data TypeScript (Agent, Room, Message, Persona, Settings)
└── utils\
    └── supabase\                      # Inisialisasi Supabase client (browser, server, middleware proteksi rute)
```

---

## 3. Database Schema (Supabase)

Tabel-tabel yang aktif digunakan di Supabase:

1. **`users`**: Dikelola oleh Supabase Auth (`auth.users`).
2. **`rooms`**:
   * `id` (UUID, PK), `title` (Text), `user_id` (UUID, FK), `theme` (Text), `memory` (Text, long-term memory), `user_persona_id` (UUID, FK), `created_at` (Timestamptz).
3. **`agents`**:
   * `id` (UUID, PK), `name` (Text), `role` (Text), `system_prompt` (Text), `avatar_url` (Text), `creator_id` (UUID), `is_public` (Boolean), `description` (Text), `created_at` (Timestamptz).
4. **`room_party`**:
   * `room_id` (UUID, FK), `agent_id` (UUID, FK).
   * ⚠️ **PENTING**: Tabel ini **TIDAK MEMILIKI** kolom `user_id`! Hanya berisi pasangan `(room_id, agent_id)`.
5. **`messages`**:
   * `id` (UUID, PK), `room_id` (UUID, FK), `sender_type` ('USER' | 'AI'), `sender_id` (UUID, FK ke agents, null jika USER), `content` (Text), `created_at` (Timestamptz).
6. **`user_personas`**:
   * `id` (UUID, PK), `user_id` (UUID, FK), `name` (Text), `background` (Text), `personality` (Text), `is_default` (Boolean), `created_at` (Timestamptz).
7. **`user_settings`**:
   * `user_id` (UUID, PK), `muted_words` (Text[]), `global_theme` (Text).
8. **`agent_likes`**:
   * `id` (UUID, PK), `user_id` (UUID, FK), `agent_id` (UUID, FK), `created_at` (Timestamptz), Unique constraint `(user_id, agent_id)`.

---

## 4. Fitur-Fitur yang Sudah Selesai 100% (Completed)

### A. Core Chat Engine & Group Inter-AI
* **Dynamic Routing**: Mendeteksi mention `@NamaAgent` atau memilih agen secara acak.
* **Inter-AI Ping Pong**: Agen AI di group chat bisa saling membalas satu sama lain secara otomatis (dibatasi 4 putaran agar tidak *infinite loop*).
* **Cross-Room Memory**: Agen dapat mengingat 15 percakapan terakhir dari room lain yang melibatkan dirinya dan pengguna.
* **Markdown & Syntax Highlighting**: Pesan AI di-render dengan format Markdown lengkap dengan pewarnaan sintaks koding (*One Dark*). Pesan user tetap plain text natural.
* **Optimistic UI & Debounce**: Pesan user muncul seketika di layar, lalu dibungkus per bubble (debounce 3 detik) ke Gemini.
* **Supabase Realtime Sync**: Sinkronisasi pesan secara instan antar perangkat / tab. Dilengkapi deduplikasi otomatis (ID optimis diganti dengan UUID database).

### B. Fitur "AI Chat Duluan" (Spontaneous Proactive Messaging)
* **Smart Follow-up (Faktual)**: Jika user pernah bercerita tentang agenda masa depan (misal: ujian, sidang skripsi, interview kerja, sakit, liburan), AI akan berinisiatif menanyakan kabarnya (*"eh gimana kemarin ujiannya, lancar ga?"*).
* **Zero Hallucination (Chit-chat Kasual)**: Jika tidak ada agenda masa lalu, AI dilarang keras mengarang cerita palsu dan hanya mengirim sapaan santai sesuai kepribadiannya (*"tumben sepi lu lagi sibuk ya"*, *"lagi ngapain lu"*).
* **Anti-Spam / Ghosting Guardrail**: Jika pesan terakhir di room adalah dari AI (belum dibalas user), sistem **DILARANG** mengirim pesan baru lagi.
* **Multi-Tab Mutex Lock**: Mencegah *multi-tab stampede* via leader-election berbasis `localStorage` sehingga tidak ada pesan duplikat saat user membuka banyak tab.
* **Tombol "✨ Chat Duluan"**: Disediakan di header [`ChatArea.tsx`](file:///d:/Project/multi-ai/components/Chat/ChatArea.tsx) untuk pengujian manual instan.

### C. Keamanan & Anti-Prompt Injection ("Respon Manusia Bingung")
* **Dynamic Persona-Tuned Confusion**: AI merespon upaya prompt injection, DAN mode, atau perintah membocorkan prompt dengan respon bingung yang **di-generate secara dinamis oleh AI sesuai gaya ketikan, aksen, dan kepribadian karakter masing-masing** (misal: karakter centil akan merespon centil dan manja, karakter tsundere akan merespon ketus/marah, karakter bapak-bapak akan merespon dengan logat bapak-bapak, bukan teks statis yang kaku).
* **Dual-Layer Defense Architecture**:
  1. *Lapis 1 (Prompt Framing)*: AI menanamkan identitas sebagai manusia asli di aplikasi chat yang menganggap istilah bot/AI sebagai ocehan aneh teman.
  2. *Lapis 2 (Server Interceptor)*: Backend secara otomatis mendeteksi jika output AI mengandung tanda kebocoran prompt atau penolakan kaku (*"sebagai model AI..."*), lalu menimpanya dengan respon bingung yang di-generate dinamis secara instan sesuai karakter agen tersebut.
* **Sanitasi Delimiter**: Pembersihan karakter pengontrol `|||`, `[Bubble]`, dan `[SYSTEM]` dari input pengguna.
* **Memory Anti-Poisoning**: API konsolidasi memori memfilter instruksi jahat di dalam riwayat chat lama.
* **Penyaringan Kata Terlarang (Muted Words)**: Diterapkan dengan regex langsung di server.

### D. Fitur Komunitas & Eksplorasi
* **Upload / Publish Character**: Pengguna dapat mempublikasikan karakter AI pribadinya ke Explore lengkap dengan deskripsi singkat.
* **Explore AI Marketplace**: Menampilkan semua karakter publik buatan komunitas.
* **Sistem Like ❤️**: Pengguna bisa menyukai/membatalkan like pada karakter publik. Jumlah like terhitung secara realtime.
* **Mulai Chat Cerdas**: Mengklik "Mulai Chat Baru" pada karakter di Explore akan memeriksa apakah room privat dengan karakter tersebut sudah pernah ada. Jika ada, room lama dibuka kembali tanpa membuat room duplikat.
* **Avatar Generator (Pollinations.ai)**: Tombol **✨ AI** di modal pembuatan kontak untuk men-generate foto avatar anime otomatis tanpa API key.

### F. PWA (Progressive Web App) & Push Notifications
* **Add to Home Screen (Mobile & Desktop)**:
  * Web App Manifest lengkap (`app/manifest.ts` & `public/manifest.json`) dengan nama *Multi-AI*, icons (192x192, 512x512, apple-touch-icon), background `#0a0f1d`, theme `#3b82f6`, dan `display: "standalone"`.
  * Tombol instalasi cepat di Sidebar: `"📲 Pasang di Layar Utama HP"`.
  * Panduan instalasi mandiri untuk iOS Safari (ikon Share ⎋ -> Add to Home Screen ➕).
* **Service Worker & Push Notifications (`public/sw.js`)**:
  * Pendaftaran otomatis Service Worker dengan penanganan `install`, `activate`, `push`, dan `notificationclick`.
  * Mengarahkan / membuka ruang chat terkait ketika notifikasi diklik (`client.navigate('/?room=...')` atau postMessage `OPEN_ROOM`).
* **Sistem Notifikasi AI Otomatis (`hooks/useWebNotifications.ts`)**:
  * Mengirim notifikasi lokal/native saat AI mengirim balasan pesan atau memulai *chat duluan* ketika tab browser sedang tertutup/berada di latar belakang (`document.hidden`) atau saat user sedang berada di room yang berbeda.
  * Status badge izin notifikasi (*Aktif*, *Belum Aktif*, *Diblokir*) di Modal Pengaturan (`🔔 Notifikasi & App`).
  * Tombol **"✨ Tes Notifikasi Sekarang"** untuk menguji notifikasi langsung tanpa menunggu pesan AI.

### G. Voice Call (1-on-1 & Group Call) & Penggabungan Memori Grup
* **Turn-Taking Orchestrator API (`/api/call/turn`)**:
  * Mengatur koordinasi giliran bicara multi-agen di panggilan grup: mendeteksi panggilan nama secara spesifik atau memilih agen yang relevan.
  * Mendukung **Inter-AI Banter**: AI bisa saling menyahut berurutan di telepon (dibatasi 2 putaran) sebelum mengembalikan giliran ke user.
  * Format percakapan lisan ringkas (1-2 kalimat), tanpa markdown dan tanpa emoji agar pelafalan TTS terdengar luwes dan alami.
* **Penggabungan Memori Grup & Post-Call Summary (`/api/call/end`)**:
  * Saat telepon ditutup, Gemini merangkum topik pembicaraan dan mengekstrak fakta penting, preferensi user, jadwal/ujian, serta sudut pandang tiap agen.
  * **Pembaruan `rooms.memory`**: Memori jangka panjang grup diperbarui otomatis dengan hasil konsolidasi.
  * **Dukungan Cross-Room**: Karakter yang ikut di panggilan grup dapat mengingat apa yang dibicarakan di telepon saat nanti user mengobrol secara privat 1-on-1.
  * **Kartu Sesi Chat (`MessageItem`)**: Muncul kartu interaktif `📞 Panggilan Suara Berakhir` di ruang chat lengkap dengan durasi, ringkasan, dan accordion transkrip percakapan.
* **Audio Pipeline Hook (`hooks/useVoiceCall.ts`)**:
  * Web Speech Recognition (`id-ID`) untuk input suara user secara realtime dengan interim results.
  * Web Speech Synthesis (`window.speechSynthesis`) dengan modulasi pitch dan speed unik per agen.
  * **Anti-Echo Feedback**: Mikrofon user otomatis dinonaktifkan sementara saat AI sedang berbicara di speaker.
* **Layar Panggilan Discord / FaceTime Style (`components/Call/CallModal.tsx` & `CallParticipantTile.tsx`)**:
  * Grid peserta responsif dengan glowing pulse border hijau dan ombak audio (*speaking visualizer*) saat seorang agen/user berbicara.
  * Floating closed captions (subtitle) di bagian bawah.
  * Kontrol panggilan: Toggle Mic Mute, Speaker Deafen, dan Tutup Telepon (Hang Up).

### H. Fitur Pelengkap & Penutupan Celah Keamanan/Audio
* **Text-to-Speech (TTS) di Setiap Bubble Chat AI**:
  * Tombol speaker `🔊` pada bubble pesan AI untuk mendengarkan pesan suara tanpa harus masuk sesi panggilan telepon.
  * Pembersih teks otomatis (`cleanTextForSpeech`) yang membuang format markdown, blok kode koding, tag gambar, dan emoji agar pengucapan TTS terdengar fasih dan alami dalam bahasa Indonesia.
  * Tombol berubah menjadi stop `⏹️` dengan indikator aktif saat audio sedang berbicara.
* **Pinned Messages (Sematkan Pesan Penting)**:
  * Tombol `📌` pada bubble chat untuk menyematkan pesan penting per room.
  * Menampilkan sticky banner di bawah header chat: klik banner untuk langsung melompat (*smooth scroll*) ke pesan yang disematkan, lengkap dengan tombol lepas sematan (*unpin*).
* **In-Chat Message Search (Pencarian Kata/Topik di Chat)**:
  * Tombol pencarian `🔍` di header room obrolan untuk mencari kata atau topik tertentu.
  * Menampilkan jumlah pesan yang cocok dan menyorot (*highlight*) pesan dengan border kuning.
* **Bersihkan Riwayat Chat (Clear Chat History)**:
  * Tombol di `InfoPanel` untuk menghapus seluruh riwayat pesan di room tanpa harus menghapus room atau karakter AI-nya.
* **Penutupan Celah Audio Mobile (iOS Safari & Android Chrome)**:
  * *Silent audio warmup* instan pada saat tombol telepon ditekan agar browser mobile tidak memblokir pemutaran TTS asinkron (*autoplay restriction policy*).
* **Penutupan Celah Panggilan Kosong**:
  * Guardrail pada penutupan telepon: jika panggilan berlangsung < 3 detik atau transkrip kosong, sistem tidak memanggil Gemini summarization dan tidak membuat kartu kosong di chat (menghemat kuota token AI dan menjaga kerapian chat).
* **Fitur Log Out (Keluar Akun) & Proteksi Dashboard**:
  * Pengguna yang belum login diarahkan ke Landing Page (`/` atau `/landing`) dan **sama sekali tidak bisa mengakses Dashboard** (ruang obrolan, kontak, pesan, explore, dan panggilan suara).
  * Tombol **Keluar / Log Out** dapat diakses dengan mudah di 3 tempat strategis:
    1. **Sidebar Footer**: Tombol merah khusus di samping tile profil pengguna.
    2. **Tab Profil (`ProfileView`)**: Tombol "Keluar" di jajaran tombol aksi atas di samping Pengaturan.
    3. **Modal Pengaturan (`SettingsModal`)**: Tab "Akun" -> Kartu "Sesi Akun" -> Tombol "Keluar".
  * Konfirmasi peringatan sebelum logout untuk mencegah klik tidak sengaja.
  * Menghapus sesi Supabase Auth (`supabase.auth.signOut()`) dan me-redirect browser kembali ke Landing Page (`/`).
* **Modern Blue Glassmorphism Landing Page**:
  * Diadaptasi dari struktur visual *Dreamweave* dengan sentuhan palet biru modern (*vibrant blue, cyan, indigo*) yang elegan dan responsif.
  * Fitur Landing Page mencakup:
    * **Hero Section Asimetris**: Headline modern, CTA "Mulai Sekarang" & "Log In", floating mockup kartu panggilan suara aktif dan obrolan grup.
    * **Live Voice Simulator & Customizer**: Slider kepribadian (Tingkat Empati & Sense of Humor), pemilihan gender, serta preview suara AI interaktif via Web Speech API (`id-ID`).
    * **Showcase Fitur Unggulan**: Kartu modern untuk Proactive Chat ("AI Chat Duluan"), Group Voice Call, dan Marketplace Karakter AI Publik.
    * **Group Call Preview**: Visualisasi mockup panggilan suara multi-agent dengan 4 peserta aktif (Kuro, Nofa, Elina, User).
* **Sistem Custom Toast & Custom Confirm Modal (Tanpa Native Alert)**:
  * Menghapus 100% pemanggilan `window.alert()` dan `window.confirm()` bawaan browser yang kaku dan memblokir thread.
  * Digantikan oleh komponen React kustom [`components/Modern/Toast.tsx`](file:///d:/Project/multi-ai/components/Modern/Toast.tsx) (4 varian dengan progress timer & confirm modal dialog).
* **Background Gambar Futuristik untuk Halaman Login & Register**:
  * Wallpaper digital cyber glass realm beresolusi tinggi (`/auth-bg.jpg`) yang dihasilkan khusus untuk Multi-AI dengan tema deep royal blue, luminous cyan circuits, dan arsitektur kaca transparan.
  * Kartu formulir Masuk dan Daftar mengambang di atasnya dengan efek *frosted glassmorphism* transparan ultra-elegan (`backdrop-blur-2xl bg-white/95`) dan ambient vignette untuk menjaga keterbacaan teks.

### I. Gemini Voice Preview Simulator di Landing Page
* **Public Endpoint `/api/voice-preview`**:
  * Menggunakan Google Gemini API (`gemini-3.5-flash-lite`) untuk merangkai dialog lisan bahasa Indonesia yang natural, hangat, dan ekspresif tanpa memerlukan login pengguna.
  * Menerima parameter karakter: `gender` ('Male' | 'Female'), `empathy` (0-100%), dan `humor` (0-100%).
  * Prompt dirancang khusus agar Gemini menghasilkan 1 kalimat sapaan lisan (12-14 kata) santai/gaul tanpa markdown, tanpa quotes, dan tanpa kata pengantar.
* **Simulator Karakter Interaktif (`LandingPage.tsx`)**:
  * Slider Tingkat Empati dan Sense of Humor dengan toggle vokal Laki-laki / Perempuan.
  * Menampilkan kotak respons dialog Gemini (`Gemini 3.5 Spoken Greeting`) lengkap dengan kuotasi dialog dan tombol putar ulang (*Replay*).
  * **Animated Audio Wave Visualizer**: 4 bar visualisasi gelombang suara berombak secara realtime saat vokal sedang bersuara.
  * **Web Speech Synthesis (`id-ID`)**: Pelafalan lisan otomatis dengan deteksi suara bahasa Indonesia di browser serta modulasi pitch berbeda untuk vokal cowok (0.9) dan cewek (1.15).
  * Tombol dinamis multi-state: *TES SUARA DENGAN GEMINI*, *Gemini Merangkai Kata...*, dan *Hentikan Suara Karakter*.

### J. Arsitektur Prompt AI High-EQ & Dynamic Voice
* **Identitas Karakter Sebagai Prioritas Utama (`selectedAgent.system_prompt`)**:
  * Mengeliminasi pembatasan kaku terdahulu yang memaksa seluruh karakter mengetik huruf kecil (*lowercase only*) dan melarang tanda baca, yang sebelumnya merusak karakter-karakter unik (seperti mentor, dosen, karakter anime elegan, dsb).
  * Kepribadian, latar belakang, dan gaya bicara asli karakter kini menjadi acuan nomor satu.
* **Kedalaman Respons Adaptif (Adaptive Depth)**:
  * **Chit-chat santai**: AI membalas secara ringkas, luwes, dan natural (1–3 kalimat).
  * **Pertanyaan mendalam, curhat, storytelling, atau coding**: AI memberikan penjelasan berbobot, suportif, dan edukatif tanpa memotong jawaban secara artifisial.
* **Format Markdown & Syntax Highlighting Aktif**:
  * Memanfaatkan dukungan `react-markdown` dan `react-syntax-highlighter` di UI chat. Ketika user meminta kode pemrograman, panduan langkah-langkah, atau resep, AI menyertakan blok kode dengan tag bahasa (` ```python `, dsb) dan bullet points rapi.
* **Spoken-Optimized Prompt untuk Voice Call (`/api/call/turn`)**:
  * Dirancang khusus untuk modulasi Text-to-Speech (TTS): membuang simbol markdown mentah dan emoji yang dapat mengacaukan lafal audio, menggantinya dengan intonasi jeda dan kata sambung lisan yang hidup (*"eh", "wah", "santai aja", "nah gitu" *).
* **Proactive Reach-out Cerdas (`/api/chat/proactive`)**:
  * Mengutamakan tindak lanjut (*follow-up*) terhadap janji/agenda nyata dari memori user, atau celetukan santai spontan yang autentik tanpa embel-embel kalimat asisten klise (*"Ada yang bisa saya bantu?"*).

---

## 5. Gotchas & Catatan Teknis Kritis (Jangan Diulangi!)

1. **Skema `room_party`**:
   * Jangan pernah memasukkan `user_id` ke `room_party`. Kolomnya hanya `room_id` dan `agent_id`. `user_id` disimpan di tabel `rooms`.
2. **Model Gemini**:
   * Gunakan model `gemini-3.5-flash-lite`. Model lama seperti `gemini-1.5-flash` sudah tidak tersedia (404) pada konfigurasi API saat ini.
3. **Unread Badges Realtime**:
   * Pengecekan realtime untuk unread badge harus di-subscribe di tingkat global (`app/page.tsx`) mendengarkan semua pesan yang masuk ke room milik user, bukan hanya room yang aktif.
4. **Deduplikasi Pesan Realtime**:
   * Pesan optimis lokal memiliki ID berawalan `opt-`. Saat Supabase Realtime menerima insert dengan UUID baru, cocokkan `content` dan `sender_type` untuk menggantikan pesan optimis, bukan menambahkan pesan baru.
5. **PWA di Mobile (iOS Safari vs Chrome/Android)**:
   * Event `beforeinstallprompt` hanya didukung di Chromium (Android/Chrome/Edge). Untuk iOS Safari, browser tidak menyediakan prompt otomatis via kode; berikan petunjuk tap tombol Share -> Tambah ke Layar Utama.
   * Service Worker harus di-serve dari direktori root (`/sw.js`) agar memiliki scope ke seluruh path aplikasi (`/`).
6. **Voice Call & Echo Loop**:
   * Saat agen AI sedang berbicara lewat speaker (`speechSynthesis.speak`), speech recognition harus ditangguhkan sementara (`abort()`) agar suara AI tidak memantul masuk ke mikrofon dan memicu loop.
7. **Tipe Data `sender_type`**:
   * Tabel `messages` dan `types/chat.ts` mendukung `'USER' | 'AI' | 'SYSTEM'`. Kartu sesi telepon menggunakan `SYSTEM` agar tidak dianggap pesan dari user ataupun karakter agen tertentu.
8. **Audio Autoplay di iOS Safari / Android**:
   * Pemicuan `speechSynthesis.speak` di mobile harus memiliki warmup / unlock di dalam event klik langsung (*user gesture*).
9. **Body Overflow & Window Scroll**:
   * Jangan pernah menambahkan `overflow-hidden` ke tag `<body>` di `app/layout.tsx` karena akan mematikan scrolling pada seluruh halaman panjang seperti Landing Page. Cukup pasang `h-screen overflow-hidden` secara lokal di komponen `DashboardClient`.

---

## 6. Backlog / Ide Pengembangan Berikutnya (Yang Kurang / Bisa Ditingkatkan)

Jika ingin menambah fitur baru di masa depan, berikut kandidat terbaik yang belum diimplementasikan:

1. **Web Push via VAPID / Push Service Backend**:
   * Menambahkan integrasi `web-push` library di backend menggunakan VAPID keys untuk mentrigger push notification jarak jauh bahkan ketika browser benar-benar ditutup secara total di OS.
2. **Kirim Gambar / Lampiran File**:
   * Mengunggah gambar dari galeri/kamera untuk dianalisis oleh multimodal Gemini.
3. **Edit Karakter Langsung**:
   * Menyediakan modal untuk mengedit nama, avatar, dan `system_prompt` karakter yang sudah dibuat tanpa harus masuk ke database Supabase.

---

## 7. Status Verifikasi Terkini
* **Build**: ✅ `npm run build` sukses 100% (*exit code 0*), lolos TypeScript dan semua rute App Router.
* **Dev Server**: ✅ Berjalan stabil di `http://localhost:3000` dan Local Network `http://192.168.18.31:3000`.
* **Voice Call & TTS**: ✅ Audio warmup mobile aktif, TTS bubble berfungsi, pin message & in-chat search aktif, pembersihan riwayat chat siap digunakan.
