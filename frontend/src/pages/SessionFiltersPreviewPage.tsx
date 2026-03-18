import { useState } from "react";
import { SessionFilters, SessionFilterState } from "components/SessionFilters";
import { Helmet } from "react-helmet-async";

const ExamplePage = () => {
  // Initialize state for filters
  const [filters, setFilters] = useState<SessionFilterState>({
    search: '',
    client: '',
    project: '',
    tags: [],
    hasNotes: null
  });

  return (
    <div className="w-full bg-white flex justify-center items-center p-4">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://dicta-notes.com/sessions" />
        <title>Session Filters Preview - Dicta-Notes</title>
      </Helmet>
      <div className="max-w-4xl w-full">
        <h1 className="text-2xl font-bold mb-4">Session Filters Example</h1>
        <SessionFilters 
          onFilterChange={setFilters}
          filters={filters}
        />
      </div>
    </div>
  );
};

export default ExamplePage;
