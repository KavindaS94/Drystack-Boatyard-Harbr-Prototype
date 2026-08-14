import { MarinaProvider } from "./store/marina-store";

function App() {
  return (
    <MarinaProvider>
      <main className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-semibold text-neutral-900">Harbr prototype</h1>
        <p className="mt-2 text-neutral-600">
          Boatyard + Dry storage — not the live app
        </p>
      </main>
    </MarinaProvider>
  );
}

export default App;
