import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, CheckCircle, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Feedback = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const user = {
    email: "admin@company.com",
    role: "admin"
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setSubmitted(true);
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback! It will help improve our AI agents.",
    });

    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  const StarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-colors"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-green-900 mb-4">
                  Thank You for Your Feedback!
                </h1>
                <p className="text-green-700 mb-6">
                  Your feedback helps us continuously improve our AI assessment agents and provide better cybersecurity evaluations.
                </p>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/assessment/${id}/report`)}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Report
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-blue-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Assessment Feedback</h1>
              <p className="text-slate-600">Help us improve our AI-powered cybersecurity assessments</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>How was your assessment experience?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Overall Rating
                </label>
                <StarRating />
                <p className="text-xs text-slate-500 mt-2">
                  {rating === 0 && "Please select a rating"}
                  {rating === 1 && "Poor - Many issues with the assessment"}
                  {rating === 2 && "Fair - Some issues that need improvement"}
                  {rating === 3 && "Good - Generally satisfied with minor issues"}
                  {rating === 4 && "Very Good - Mostly excellent with small improvements needed"}
                  {rating === 5 && "Excellent - Outstanding assessment experience"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Detailed Feedback (Optional)
                </label>
                <Textarea
                  placeholder="Tell us about your experience with the AI agents, report quality, workflow, or suggestions for improvement..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Assessment Summary</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>• Assessment completed with 15 AI agents</div>
                  <div>• ISSO-Lead summary compilation performed</div>
                  <div>• ISSM review and approval completed</div>
                  <div>• Professional report generated</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <Button 
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Skip Feedback
                </Button>
                
                <Button 
                  onClick={handleSubmitFeedback}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
