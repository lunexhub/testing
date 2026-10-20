export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          WhatsApp Booking System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Powered by VoiceOffice
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md">
          <p className="text-green-800 font-medium mb-2">
            ✅ Webhook Active
          </p>
          <p className="text-sm text-gray-600">
            Send a WhatsApp message to your VoiceOffice number to start booking!
          </p>
        </div>
        <div className="mt-8 text-left max-w-md mx-auto">
          <h2 className="font-bold mb-2">Features:</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Natural conversation flow</li>
            <li>Service selection</li>
            <li>Date & time booking</li>
            <li>Instant confirmations</li>
            <li>24-hour reminders</li>
            <li>Follow-up messages</li>
            <li>Easy cancellation</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
