import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2 } from 'lucide-react';
import { Company } from 'utils/company/types';
import { CompanyValidator } from 'utils/CompanyValidator';

interface Props {
  onCompanyChange: (companyId: string | null, company: Company | null) => void;
  onMeetingTitleUpdate?: (title: string) => void;
}

/**
 * Component that handles company context loading from URL params
 * and displays company information when a company is associated with the session.
 */
export function TranscribeCompanySection({ onCompanyChange, onMeetingTitleUpdate }: Props) {
  const location = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState<boolean>(false);

  // Handle company ID from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const companyIdParam = searchParams.get('companyId');
    
    if (companyIdParam) {
      const loadCompany = async () => {
        setLoadingCompany(true);
        try {
          const companyData = await CompanyValidator.validateCompanyAccess(companyIdParam);
          
          if (companyData) {
            setCompany(companyData);
            onCompanyChange(companyIdParam, companyData);
            
            // Update meeting title to include company name if callback provided
            if (onMeetingTitleUpdate) {
              onMeetingTitleUpdate(`${companyData.name} Meeting`);
            }
          } else {
            // If company not found or no access, clear company context
            setCompany(null);
            onCompanyChange(null, null);
            
            // Remove invalid company ID from URL
            CompanyValidator.removeCompanyFromUrl(companyIdParam);
          }
        } catch (error) {
          console.error('Error loading company:', error);
          setCompany(null);
          onCompanyChange(null, null);
        } finally {
          setLoadingCompany(false);
        }
      };
      
      loadCompany();
    }
  }, [location.search]);

  // Don't render anything if no company or still loading
  if (!company || loadingCompany) {
    return null;
  }

  return (
    <div className="flex items-center mt-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-200 bg-blue-50">
              <Building2 size={14} />
              {company.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>This meeting will be saved to the company: {company.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
