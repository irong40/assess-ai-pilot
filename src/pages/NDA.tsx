
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NDA = () => {
  const [accepted, setAccepted] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProceed = () => {
    if (accepted && understood) {
      // Store NDA acceptance in localStorage for this prototype
      localStorage.setItem(`nda_accepted_${user?.id}`, 'true');
      navigate("/dashboard");
    }
  };

  const canProceed = accepted && understood;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Non-Disclosure Agreement
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Please review and accept the NDA before accessing the Sentinel AI prototype
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Prototype Access - Confidential Information
              </span>
            </div>
          </div>

          <ScrollArea className="h-64 w-full border rounded-lg p-4 mb-6 bg-gray-50">
            <div className="space-y-4 text-sm text-gray-700">
              <h3 className="font-semibold text-gray-900">NON-DISCLOSURE AGREEMENT</h3>
              
              <p>
                This Non-Disclosure Agreement ("Agreement") is entered into between you ("Recipient") 
                and Sentinel AI ("Company") regarding access to the Sentinel AI prototype application.
              </p>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Confidential Information</h4>
                <p>
                  "Confidential Information" includes all information, technical data, trade secrets, 
                  know-how, research, product plans, products, services, customers, customer lists, 
                  markets, software, developments, inventions, processes, formulas, technology, 
                  designs, drawings, engineering, hardware configuration information, marketing, 
                  finances, or other business information disclosed by Company.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Obligations</h4>
                <p>
                  Recipient agrees to: (a) hold all Confidential Information in strict confidence; 
                  (b) not disclose Confidential Information to any third parties; (c) not use 
                  Confidential Information for any purpose other than evaluating the prototype; 
                  (d) protect Confidential Information with the same degree of care used to protect 
                  Recipient's own confidential information.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Prototype Access</h4>
                <p>
                  This prototype is provided for evaluation purposes only. All features, 
                  functionality, and interfaces are proprietary and confidential. Screenshots, 
                  recordings, or documentation of the system are prohibited without express 
                  written consent.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. Term</h4>
                <p>
                  This Agreement shall remain in effect for a period of 5 years from the date 
                  of acceptance or until terminated by Company, whichever comes first.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">5. Return of Information</h4>
                <p>
                  Upon termination of access or upon Company's request, Recipient shall promptly 
                  return or destroy all materials containing Confidential Information.
                </p>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </ScrollArea>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="accept-nda" 
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <label 
                htmlFor="accept-nda" 
                className="text-sm text-gray-700 leading-5 cursor-pointer"
              >
                I have read and agree to the terms of this Non-Disclosure Agreement. 
                I understand that I am legally bound by these terms.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="understand-prototype" 
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              />
              <label 
                htmlFor="understand-prototype" 
                className="text-sm text-gray-700 leading-5 cursor-pointer"
              >
                I understand this is a prototype system and that all information, 
                features, and functionality are confidential and proprietary.
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Cancel
            </Button>
            
            <Button 
              onClick={handleProceed}
              disabled={!canProceed}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              Accept & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NDA;
