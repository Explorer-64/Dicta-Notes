import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionListItem } from "../brain/data-contracts";

interface CompanySessionsProps {
  companyId: string;
  sessions: {
    sessions: SessionListItem[];
    total_count: number;
  };
  onCreateSession: () => void;
  onViewSession: (sessionId: string) => void;
}

const CompanySessions = ({ 
  companyId, 
  sessions, 
  onCreateSession, 
  onViewSession 
}: CompanySessionsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle data-translate>Company Sessions</CardTitle>
            <CardDescription data-translate>
              View and manage transcription sessions for this company
            </CardDescription>
          </div>
          <Button onClick={onCreateSession} data-translate>New Session</Button>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.sessions.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <p className="mb-4" data-translate>No sessions in this company yet.</p>
            <Button onClick={onCreateSession} data-translate>Create First Session</Button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left" data-translate>Title</th>
                <th className="px-4 py-2 text-left hidden md:table-cell" data-translate>Created</th>
                <th className="px-4 py-2 text-left hidden sm:table-cell" data-translate>Duration</th>
                <th className="px-4 py-2 text-left" data-translate>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.sessions.map((session) => (
                <tr key={session.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{session.title}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(session.created_at * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 hidden sm:table-cell">
                    {session.duration ? `${Math.floor(session.duration / 60)}:${String(session.duration % 60).padStart(2, '0')}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" onClick={() => onViewSession(session.id)} data-translate>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      {sessions.total_count > 10 && (
        <CardFooter>
          <Button variant="outline" className="w-full">
            View All Sessions ({sessions.total_count})
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CompanySessions;
