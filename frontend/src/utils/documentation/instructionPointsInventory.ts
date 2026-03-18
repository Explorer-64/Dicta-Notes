/**
 * Instruction Points Inventory
 *
 * This file provides a comprehensive inventory of all instruction points in the 
 * Dicta-Notes app, with recommendations for adding guidance about company 
 * ownership and admin roles.
 */

export interface InstructionPoint {
  location: string;
  description: string;
  hasOwnershipGuidance: boolean;
  recommendedAdditions?: string;
}

export interface OwnershipGuidanceTopic {
  topic: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  existingCoverage: 'none' | 'partial' | 'complete';
}

/**
 * Current instruction points in the application
 */
export const currentInstructionPoints: InstructionPoint[] = [
  {
    location: "Instructions Page - Getting Started tab",
    description: "Overview of app features and purpose",
    hasOwnershipGuidance: false
  },
  {
    location: "Instructions Page - Recording & Transcription tab",
    description: "How to record and transcribe meetings",
    hasOwnershipGuidance: false
  },
  {
    location: "Instructions Page - Document Processing tab",
    description: "How to capture and analyze meeting documents",
    hasOwnershipGuidance: false
  },
  {
    location: "Instructions Page - Session Management tab",
    description: "How to save, organize, and review transcriptions",
    hasOwnershipGuidance: false
  },
  {
    location: "Instructions Page - Company Features tab",
    description: "Basic information about company workspaces, with sections on creating companies, inviting team members, and role permissions",
    hasOwnershipGuidance: false,
    recommendedAdditions: `Add sections on:
    1. Company ownership vs admin roles
    2. Ownership transfer process
    3. Company deletion permissions`
  },
  {
    location: "Home Page (App.tsx)",
    description: "Feature overview sections that include 'Company Workspaces' and 'Team Collaboration' descriptions",
    hasOwnershipGuidance: false
  },
  {
    location: "AcceptInvitation Page",
    description: "Explains what company a user is joining and what role they are being assigned",
    hasOwnershipGuidance: false,
    recommendedAdditions: "Add brief explanation of what the assigned role means in terms of permissions"
  },
  {
    location: "Companies Page",
    description: "UI for creating companies and listing companies the user belongs to",
    hasOwnershipGuidance: false
  },
  {
    location: "Company Detail Page",
    description: "Tabs for Overview, Members, Sessions with no specific instructions about ownership or special permissions",
    hasOwnershipGuidance: false,
    recommendedAdditions: "Add ownership information to the Overview tab, clarifying who the owner is"
  },
  {
    location: "Company Members Component",
    description: "UI for inviting members and setting roles, but missing explanation of different role permissions and capabilities",
    hasOwnershipGuidance: false,
    recommendedAdditions: "Add tooltips explaining different roles and their permissions"
  },
  {
    location: "CompanyOverview Component",
    description: "Shows company information and allows editing based on user role",
    hasOwnershipGuidance: false,
    recommendedAdditions: "Add section showing current owner and ownership transfer option for owner"
  }
];

/**
 * Missing instruction topics related to company ownership
 */
export const ownershipGuidanceTopics: OwnershipGuidanceTopic[] = [
  {
    topic: "Owner vs Admin Role Differences",
    description: `Clear explanation of the difference between:
      - Owner: The creator or transferee who has ultimate authority
      - Admin: Can manage users and company settings but can't delete the company or transfer ownership`,
    priority: 'high',
    existingCoverage: 'none'
  },
  {
    topic: "Ownership Responsibilities",
    description: "Explanation that the owner has full control over the company, including deletion and transferring ownership",
    priority: 'high',
    existingCoverage: 'none'
  },
  {
    topic: "Ownership Transfer Process",
    description: "Instructions on how to transfer company ownership, requirements (recipient must be a company member), and security implications",
    priority: 'medium',
    existingCoverage: 'none'
  },
  {
    topic: "Company Deletion Permission",
    description: "Clarification that only the company owner can delete a company",
    priority: 'medium',
    existingCoverage: 'partial'
  },
  {
    topic: "Admin Role Management",
    description: "Guidance on when/why to promote members to admin, what admins can and cannot do compared to owners",
    priority: 'medium',
    existingCoverage: 'partial'
  },
  {
    topic: "Member Role Limitations",
    description: "Clear explanation of what regular members and guests can and cannot do",
    priority: 'low',
    existingCoverage: 'partial'
  }
];

/**
 * HTML/JSX recommendations for adding to Instructions page
 */
export const companyRolesInstructionsHtml = `
<h3 className="text-lg font-medium">Company Roles Explained</h3>
<p>
  Dicta-Notes uses a hierarchical role system to manage company access:
</p>
<ul className="list-disc pl-6 space-y-2">
  <li>
    <strong>Owner</strong> - Has full control over the company. Can delete the company, transfer ownership, 
    manage all users, and configure all settings. There is only one owner per company.
  </li>
  <li>
    <strong>Admin</strong> - Can manage users, invite new members, and configure company settings. 
    Cannot delete the company or transfer ownership.
  </li>
  <li>
    <strong>Member</strong> - Can create and edit transcripts based on assigned permissions.
  </li>
  <li>
    <strong>Guest</strong> - Limited access with customizable viewing permissions only.
  </li>
</ul>

<h3 className="text-lg font-medium">Transferring Company Ownership</h3>
<p>
  Company owners can transfer ownership to another company member:
</p>
<ol className="list-decimal pl-6 space-y-2">
  <li>Go to your company's page</li>
  <li>Select the <strong>Members</strong> tab</li>
  <li>Find the user you want to transfer ownership to</li>
  <li>Click the <strong>Transfer Ownership</strong> button next to their name</li>
  <li>Confirm the transfer when prompted</li>
</ol>
<p className="mt-2 text-yellow-500">
  <strong>Important:</strong> Transferring ownership is permanent and gives the new owner full control 
  over the company, including the ability to remove you as a member.
</p>
`;

/**
 * Implementation recommendations in priority order
 */
export const implementationRecommendations = [
  {
    title: "Update Instructions Page",
    description: "Add company ownership and role guidance to the Company Features tab of the Instructions page",
    priority: 'high',
    component: 'ui/src/pages/Instructions.tsx',
    implementation: "Add the companyRolesInstructionsHtml content to the Company Features tab"
  },
  {
    title: "Add Owner Information to Company Overview",
    description: "Display the company owner's name/email in the Company Overview component and add transfer button for owners",
    priority: 'medium',
    component: 'ui/src/components/CompanyOverview.tsx',
    implementation: "Add a section showing who the owner is and a transfer ownership button if the current user is the owner"
  },
  {
    title: "Add Role Tooltips to Company Members Page",
    description: "Add tooltips explaining different roles next to the role selection dropdown",
    priority: 'medium',
    component: 'ui/src/components/CompanyMembers.tsx',
    implementation: "Add tooltips explaining the permissions of each role"
  },
  {
    title: "Create Transfer Ownership Dialog",
    description: "Implement a dialog component for transferring ownership to another company member",
    priority: 'low',
    component: 'ui/src/components/TransferOwnershipDialog.tsx (new)',
    implementation: "Create new dialog component with member selection and confirmation flow"
  }
];
