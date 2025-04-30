import { Header } from "@/components/header"
import { WalletDashboard } from "@/components/wallet-dashboard"

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <div className="container mx-auto px-6 py-6">
        <WalletDashboard />
      </div>
    </main>
  )
}
