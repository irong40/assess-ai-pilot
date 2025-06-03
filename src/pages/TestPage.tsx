
import Header from "@/components/Header";
import TestAssessmentFlow from "@/components/TestAssessmentFlow";

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessment Testing Suite</h1>
            <p className="text-slate-600">
              Comprehensive testing of the assessment workflow including creation, agent execution, and reporting
            </p>
          </div>
          
          <TestAssessmentFlow />
        </div>
      </main>
    </div>
  );
};

export default TestPage;
