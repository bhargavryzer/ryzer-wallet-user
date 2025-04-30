import { Header } from "@/components/header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { PortfolioDashboard } from "@/components/portfolio-dashboard";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* Tabs Section */}
        <Tabs defaultValue="wallet" className="w-full  md:w-auto">
          <div className="flex justify-between">
          <TabsList className="bg-white shadow-md rounded-lg p-2 gap-6">
            <TabsTrigger
              value="wallet"
              className="px-6 py-2 rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Wallet
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="px-6 py-2 rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Portfolio
            </TabsTrigger>
          
          </TabsList>

          <div className="w-32 md:w-48">
              <Select>
                <SelectTrigger className="w-full bg-white shadow-md rounded-lg h-12">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Ethereum</SelectItem>
                  <SelectItem value="portfolio">Polygon</SelectItem>
                  <SelectItem value="network">XDC Network</SelectItem>
                </SelectContent>
              </Select>
          </div>
            </div>

          <div className="mt-6">
            <TabsContent value="wallet">
              <WalletDashboard />
            </TabsContent>
            <TabsContent value="portfolio">
              <PortfolioDashboard />
            </TabsContent>
          </div>
        </Tabs>

        {/* Select Dropdown */}
      </div>
    </main>
  );
}
