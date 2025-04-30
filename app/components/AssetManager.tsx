import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Mail, Phone, Video, MapPin, Briefcase, Medal, MedalIcon, Globe, Building2, Shield, DollarSign, ExternalLink, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { InvestmentAsset } from '@/lib/types';

interface AssetManagerProps {
  asset: InvestmentAsset;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ asset }) => {
  const manager = asset.assetManager;
  if (!manager) return null;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold">Asset Manager</h2>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-16 w-16 bg-gray-100">
          <AvatarFallback className="text-xl">M</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{manager.name}</h3>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs px-2 py-0.5">
              <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Verified
            </Badge>
          </div>
          <p className="text-gray-600 text-sm mb-2">Senior Asset Manager • {manager.experience}+ years experience</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{manager.rating}/5.0</span>
            </div>
            <span>•</span>
            <span>({manager.reviewCount} reviews)</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>Hyderabad, India</span>
            </div>
            <span><Globe className='w-3 h-3'/></span>
            <span>Telugu, Hindi, English</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Button className="w-full bg-black text-white hover:bg-gray-800">
          Book an Appointment
        </Button>
        <Button variant="outline" className="w-full">
          <Phone className="w-4 h-4 mr-2" />
          Call
        </Button>
        <Button variant="outline" className="w-full">
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button variant="outline" className="w-full">
          <Video className="w-4 h-4 mr-2" />
          Video Call
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-gray-50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white rounded-md">Profile</TabsTrigger>
          <TabsTrigger value="performance" className="text-gray-500">Performance</TabsTrigger>
          <TabsTrigger value="portfolio" className="text-gray-500">Portfolio</TabsTrigger>
          <TabsTrigger value="recommendations" className="text-gray-500">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none">
                  <path d="M8 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor"/>
                  <path d="M14.5 7H16m-2 3h1.5M8 14v1.5M8 .5V2M1.5 7H0m2 3H.5M3 3l1 1m8-1l-1 1M11 12l1 1M3 12l1-1" stroke="currentColor"/>
                </svg>
                Specializations
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100">Commercial Real Estate</Badge>
                <Badge className="rounded-full px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100">Rental Properties</Badge>
                <Badge className="rounded-full px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100">Asset Tokenization</Badge>
                <Badge className="rounded-full px-3 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100">Property Valuation</Badge>
                <Badge className="rounded-full px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100">Tenant Management</Badge>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Mani specializes in commercial real estate management with a focus on maximizing rental yields and property value appreciation through strategic tenant selection and property improvements.
            </p>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium mb-4">Professional Background</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded bg-[#2563EB] flex items-center justify-center text-white font-medium">
                        <Briefcase/>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[15px] font-medium text-gray-900">XYZ Holdings LLP</h5>
                      <p className="text-sm text-gray-600">Senior Asset Manager</p>
                      <p className="text-xs text-gray-500">2019 - Present</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded bg-[#9333EA] flex items-center justify-center text-white font-medium">
                        <Briefcase/>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[15px] font-medium text-gray-900">ABC Properties</h5>
                      <p className="text-sm text-gray-600">Asset Manager</p>
                      <p className="text-xs text-gray-500">2016 - 2019</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Certifications</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center">
                      <MedalIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-medium">Certified Property Manager (CPM)</h5>
                      <p className="text-xs text-gray-500">Institute of Real Estate Management</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center">
                      <MedalIcon className="w-4 h-4 text-amber-600"/>

                    </div>
                    <div>
                      <h5 className="font-medium">Real Estate Tokenization Specialist</h5>
                      <p className="text-xs text-gray-500">Blockchain Real Estate Association</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="performance">Performance metrics will go here</TabsContent>
        <TabsContent value="portfolio">Portfolio details will go here</TabsContent>
        <TabsContent value="recommendations">Recommendations will go here</TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetManager; 