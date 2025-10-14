// import './App.css'

export default function App() {
  return (
    <main className="relative min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6 overflow-hidden">
      {/* Carré d'arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 inset-0 flex items-center justify-center"
      >
        <div className="h-[28rem] w-[28rem] rounded-3xl rotate-6 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 ring-1 ring-black/10 shadow-2xl shadow-indigo-100/30 blur-[1px]" />
      </div>

      {/* Carte centrale */}
      <section className="w-full max-w-lg rounded-2xl bg-white/90 backdrop-blur shadow-xl ring-1 ring-black/5 p-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Hello <span className="text-indigo-600">React</span>
        </h1>
        <p className="mt-3 text-gray-600">
          Mini starter React + Tailwind, centré et tout doux.
          mais ça ne sert à rien a part afficher un truc, déso ⭐️
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 active:translate-y-px transition">
            Get started
          </button>
          <a
            href="#"
            className="rounded-xl px-4 py-2 font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
          >
            Learn more
          </a>
        </div>
      </section>
    </main>
  );
}
