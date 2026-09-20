import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  User,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Search,
  Filter,
  Bookmark,
  Share2,
  FileText,
  KeyRound,
  Shield,
  Phone,
  Mail,
  GraduationCap,
  Layers,
  BarChart3,
  Cloud,
  Check,
  ArrowLeft,
  X
} from 'lucide-react';
import { UserProfile, UserRole, BookRecord } from '../types/alims';
import { MemberPhotoUploader } from './MemberPhotoUploader';
import { DigitalLibrarianChatbot } from './DigitalLibrarianChatbot';
import { LicenseModal } from './LicenseModal';
import {
  MainPageBgConfig,
  loadSavedBgConfig,
  BackgroundLayer
} from './MainThemeBgSelector';
import pslimsLogo from '../assets/images/plims_emblem_logo_1788759356534.jpg';
import { PakistanFlyingFlag } from './PakistanFlyingFlag';
import { GoogleLoginButton } from './GoogleLoginButton';
import { processGoogleUserAuth, GoogleOAuthPayload } from '../services/googleAuth';

interface LoginPageProps {
  users: UserProfile[];
  branches: string[];
  books?: BookRecord[];
  onLoginSuccess: (user: UserProfile, branch: string, auditAction?: any) => void;
  onRegisterUser: (newUser: UserProfile, branch: string) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onBackToOpac?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  branches,
  books = [],
  onLoginSuccess,
  onRegisterUser,
  onUpdateUser,
  onBackToOpac,
}) => {
  // Authentication View Modes:
  // 'PORTAL': The primary landing portal (Continue with Google / Username + Password Login)
  // 'REGISTER': Academic membership registration workflow
  // 'OPAC': Public catalog and MARC21 book search
  const [authMode, setAuthMode] = useState<'PORTAL' | 'REGISTER' | 'OPAC'>('PORTAL');

  // Selected Branch (Default: Central Academic Library)
  const [selectedBranch, setSelectedBranch] = useState<string>(() => branches[0] || 'Central Academic Library');

  // Username & Password Authentication State
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Forgot Password Modal State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Registration Form State (Strictly empty, user chooses their own secure password)
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY' | 'RESEARCH_SCHOLAR' | 'GUEST'>('STUDENT');
  const [regDepartment, setRegDepartment] = useState<string>('Computer Science & Information Technology');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');

  // Status & Feedback Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // OPAC Catalog State
  const [opacSearchQuery, setOpacSearchQuery] = useState<string>('');
  const [opacDeptFilter, setOpacDeptFilter] = useState<string>('ALL');
  const [selectedOpacBook, setSelectedOpacBook] = useState<BookRecord | null>(null);

  // Modals & UI Config
  const [showLicenseModal, setShowLicenseModal] = useState<boolean>(false);
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());

  // Dynamic Background Config sync
  useEffect(() => {
    const handleStorage = () => setBgConfig(loadSavedBgConfig());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /**
   * Secure New User Registration Handler
   * Strictly restricts self-registration to non-administrative academic roles.
   * Enforces user-chosen password of at least 6 characters.
   */
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const phone = regPhone.trim();

    if (!name) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!phone) {
      setErrorMessage('Please provide a contact mobile number.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Account password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    // Check for existing account by email
    const existingUser = users.find(u => u.email && u.email.trim().toLowerCase() === email);
    if (existingUser) {
      setErrorMessage(`An account with email '${email}' already exists. Please sign in or use 'Continue with Google'.`);
      return;
    }

    setIsSubmitting(true);

    // Generate safe, role-based member code
    const rolePrefix =
      regRole === 'STUDENT'
        ? 'STU'
        : regRole === 'FACULTY'
        ? 'FAC'
        : regRole === 'RESEARCH_SCHOLAR'
        ? 'RES'
        : 'MEM';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const memberCode = `${rolePrefix}-${new Date().getFullYear()}-${randomSuffix}`;

    // Unlimited capacity borrow limit policy enabled
    const maxBorrowLimit = 99999;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberCode,
      name,
      email,
      phone,
      mobileNo: phone,
      role: regRole,
      department: regDepartment,
      designation:
        regRole === 'FACULTY'
          ? 'Faculty Member'
          : regRole === 'RESEARCH_SCHOLAR'
          ? 'Research Scholar'
          : regRole === 'STUDENT'
          ? 'Student Member'
          : 'Library Member',
      status: 'ACTIVE',
      password: regPassword,
      authProvider: 'LOCAL',
      joinedDate: new Date().toISOString().split('T')[0],
      maxBorrowLimit,
      activeBorrowCount: 0,
      currentBorrowed: 0,
      finePending: 0,
      assignedBranch: selectedBranch,
      avatarUrl: regAvatarUrl || undefined,
      rfidTag: `RFID-PK-${Math.floor(100000 + Math.random() * 900000)}`,
      staffPowers: [], // Non-admin: strictly empty staff powers
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Account created successfully! Member Code: ${memberCode}. Entering portal...`);
      setTimeout(() => {
        onRegisterUser(newUser, selectedBranch);
      }, 400);
    }, 400);
  };

  /**
   * Google OAuth Callback Handler
   * Uses real OpenID Connect payload to link or log in user.
   */
  const handleGoogleSuccess = (payload: GoogleOAuthPayload) => {
    setErrorMessage(null);
    setSuccessMessage('Verifying Google credentials with PLiMS directory...');

    try {
      const result = processGoogleUserAuth(payload, users, selectedBranch);

      if (result.isNewUser) {
        setSuccessMessage(`Welcome to PLiMS, ${result.user.name}! Your verified Google account is now active.`);
        setTimeout(() => {
          onRegisterUser(result.user, selectedBranch);
        }, 250);
      } else {
        if (result.isLinked && onUpdateUser) {
          onUpdateUser(result.user.id, {
            authProvider: 'GOOGLE',
            googleSub: result.user.googleSub,
            googleEmailVerified: result.user.googleEmailVerified,
            googleAccountLinkedAt: result.user.googleAccountLinkedAt,
            avatarUrl: result.user.avatarUrl || payload.picture,
          });
        }
        setSuccessMessage(`Welcome back, ${result.user.name}! Accessing library services...`);
        setTimeout(() => {
          onLoginSuccess(result.user, selectedBranch, result.auditAction);
        }, 250);
      }
    } catch (err: any) {
      console.error('Error in Google authentication:', err);
      setErrorMessage(err.message || 'Failed to authenticate with Google. Please try again.');
    }
  };

  /**
   * LOGIN METHOD 2: USERNAME + PASSWORD LOGIN
   * Authenticates user using their Username, Email, or Member Code against the existing PLiMS user directory.
   * Loads real role, designation, and permissions, then opens the Authenticated PLiMS Home/Dashboard.
   */
  const handleUsernamePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputId = loginIdentifier.trim();
    const inputPass = loginPassword;

    if (!inputId) {
      setErrorMessage('Please enter your Username, Member Code, or Email address.');
      return;
    }

    if (!inputPass) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    const normalizedInput = inputId.toLowerCase();
    const matchedUser = users.find(u => {
      const emailMatch = u.email && u.email.trim().toLowerCase() === normalizedInput;
      const codeMatch = u.memberCode && u.memberCode.trim().toLowerCase() === normalizedInput;
      const idMatch = u.id && u.id.trim().toLowerCase() === normalizedInput;
      const nameMatch = u.name && u.name.trim().toLowerCase() === normalizedInput;
      return emailMatch || codeMatch || idMatch || nameMatch;
    });

    if (!matchedUser) {
      setIsSubmitting(false);
      setErrorMessage(`No account found matching '${inputId}'. Please check your credentials or click 'Create New Account'.`);
      return;
    }

    // Password validation
    if (matchedUser.password && matchedUser.password !== inputPass) {
      setIsSubmitting(false);
      setErrorMessage('Incorrect password. Please verify your password or use "Forgot Password?" for guidance.');
      return;
    }

    // Check account status
    if (matchedUser.status === 'SUSPENDED') {
      setIsSubmitting(false);
      setErrorMessage('This library account is currently suspended. Please contact the Library Administration.');
      return;
    }

    if (matchedUser.status === 'EXPIRED') {
      setIsSubmitting(false);
      setErrorMessage('Your library membership has expired. Please contact circulation staff for renewal.');
      return;
    }

    setSuccessMessage(`Welcome back, ${matchedUser.name}! Loading ${matchedUser.role} dashboard...`);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(matchedUser, selectedBranch, {
        action: 'USERNAME_PASSWORD_LOGIN',
        details: `Authenticated via Username/Password as ${matchedUser.role} (${matchedUser.memberCode})`,
        timestamp: new Date().toISOString()
      });
    }, 350);
  };

  /**
   * Password Recovery / Forgot Password Assistant
   */
  const handleForgotLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    const query = forgotIdentifier.trim().toLowerCase();
    if (!query) {
      setForgotFeedback({
        type: 'error',
        message: 'Please enter your registered email address or member ID.'
      });
      return;
    }

    const matched = users.find(u =>
      (u.email && u.email.toLowerCase() === query) ||
      (u.memberCode && u.memberCode.toLowerCase() === query)
    );

    if (!matched) {
      setForgotFeedback({
        type: 'error',
        message: `No active member account found for "${forgotIdentifier}". Please register a new account or verify your details with the library helpdesk.`
      });
      return;
    }

    setForgotFeedback({
      type: 'success',
      message: `Account located: ${matched.name} (${matched.memberCode}, Role: ${matched.role}). Since credentials are institutionally governed, please log in using linked "Continue with Google", or contact Chief Librarian at central.library@pslims.edu.pk / +92 51 92654321 for a temporary security reset token.`
    });
  };

  // Filter OPAC Books for Public Search
  const filteredOpacBooks = books.filter(b => {
    const query = opacSearchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.authors.some(a => a.toLowerCase().includes(query)) ||
      b.isbn.toLowerCase().includes(query) ||
      b.callNumber.toLowerCase().includes(query) ||
      b.subjects.some(s => s.toLowerCase().includes(query));

    const matchesDept = opacDeptFilter === 'ALL' || b.department === opacDeptFilter;
    return matchesQuery && matchesDept;
  });

  return (
    <div className="min-h-screen w-full bg-[#080b09] text-[#fafafa] flex flex-col justify-between p-3 sm:p-6 font-sans relative overflow-x-hidden selection:bg-emerald-600 selection:text-white">
      {/* Background Dynamic Theme Layer */}
      <BackgroundLayer config={bgConfig} />

      {/* Top Header Navigation */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl w-full mx-auto z-10 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <img
            src={pslimsLogo}
            alt="PLiMS Logo"
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50 shadow-md shadow-emerald-500/20 shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">PLiMS</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-2xs">
                V4.1.1 PK edition
              </span>
              {/* Flying Pakistani Flag on Golden Finial Mast */}
              <div className="ml-1 pl-1 border-l border-zinc-800">
                <PakistanFlyingFlag
                  size="sm"
                  showMast={true}
                  title="Parchem-e-Sitāra-o-Hilāl • Islamic Republic of Pakistan"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">Pakistan Library Management System</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          {onBackToOpac && (
            <button
              id="btn-back-to-opac-header"
              type="button"
              onClick={onBackToOpac}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#121413] hover:bg-zinc-800 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span>Public OPAC</span>
            </button>
          )}

          {authMode === 'OPAC' ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode('PORTAL');
                setErrorMessage(null);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#121413] hover:bg-zinc-800 border border-zinc-700 text-white transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span>Back to Login Portal</span>
            </button>
          ) : !onBackToOpac ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode('OPAC');
                setErrorMessage(null);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#121413] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5 text-emerald-400" />
              <span>Public OPAC Catalog</span>
            </button>
          ) : null}

          {/* Active Branch Indicator / Selector */}
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-[#121413] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer pr-6 font-medium"
              title="Select Library Branch"
            >
              {branches.map(b => (
                <option key={b} value={b} className="bg-[#121413] text-white">
                  🏢 {b}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-zinc-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </header>

      {/* Alert Messages Banner */}
      {(errorMessage || successMessage) && (
        <div className="max-w-4xl w-full mx-auto mt-4 z-20">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2.5 shadow-md">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start space-x-2.5 shadow-md">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: PRIMARY AUTHENTICATION PORTAL (MATCHING EXACT USER MOCKUP IMAGE) */}
      {/* ========================================================================= */}
      {authMode === 'PORTAL' && (
        <main className="max-w-4xl w-full mx-auto my-auto py-6 z-10 flex items-center justify-center">
          <div className="w-full rounded-3xl shadow-2xl overflow-hidden border border-emerald-900/30 grid grid-cols-1 md:grid-cols-12 min-h-[540px] bg-white">
            
            {/* LEFT COLUMN: Deep Emerald Pakistani Brand Visuals */}
            <div className="md:col-span-6 bg-gradient-to-b from-[#063a22] via-[#042e1b] to-[#021e11] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-white">
              {/* Subtle background glow effect */}
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

              {/* Brand Header */}
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner shrink-0">
                      <BookOpen className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 font-sans flex-wrap">
                        <span>PLiMS</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-300/30 whitespace-nowrap shadow-xs">
                          V4.1.1 PK edition
                        </span>
                      </h1>
                      <p className="text-[11px] text-emerald-200/80 font-medium">Pakistan Library Management System</p>
                    </div>
                  </div>

                  {/* Majestic Flying Pakistani Flag with Golden Finial Mast */}
                  <div className="p-1.5 rounded-xl bg-emerald-950/50 border border-emerald-400/30 backdrop-blur-xs shadow-md shrink-0">
                    <PakistanFlyingFlag
                      size="md"
                      showMast={true}
                      title="Islamic Republic of Pakistan • National Flag Flying Proudly"
                    />
                  </div>
                </div>

                {/* Motto */}
                <div className="mt-8 space-y-1">
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-emerald-100">
                    Empowering Libraries
                  </p>
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-emerald-200">
                    Enabling Knowledge
                  </p>
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Inspiring Innovation
                  </p>
                </div>
              </div>

              {/* Center Stylized Illustration: Glowing Book & Orbital Modules */}
              <div className="relative z-10 py-6 my-auto flex flex-col items-center justify-center">
                <div className="relative w-48 h-40 flex items-center justify-center">
                  {/* Radiant Light Beams */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/20 to-transparent rounded-full blur-xl animate-pulse" />
                  
                  {/* Glowing Open Book Visual */}
                  <div className="relative z-10 w-28 h-20 bg-emerald-950/80 border border-emerald-400/50 rounded-2xl p-3 shadow-2xl flex flex-col justify-between items-center text-emerald-300 transform -rotate-1">
                    <BookOpen className="w-9 h-9 text-emerald-300 stroke-[1.8] animate-bounce duration-1000" />
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  {/* Orbital Floating Module Badges */}
                  <div className="absolute -top-1 -left-2 p-1.5 rounded-lg bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 shadow-md transform -rotate-6" title="MARC21 & RDA Cataloguing">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -top-1 -right-2 p-1.5 rounded-lg bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 shadow-md transform rotate-6" title="RFID Circulation Desk">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -bottom-2 -left-3 p-1.5 rounded-lg bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 shadow-md transform rotate-3" title="HEC Union Digital Catalog">
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -bottom-2 -right-3 p-1.5 rounded-lg bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 shadow-md transform -rotate-3" title="Member Services & Analytics">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <p className="text-[11px] text-emerald-200/70 text-center font-medium mt-2">
                  Unified ILS for Pakistani Universities, Colleges & Schools
                </p>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 pt-4 border-t border-emerald-800/50 flex items-center justify-between text-[11px] text-emerald-300/80">
                <span>Branch: {selectedBranch.split(' ')[0]}</span>
                <span className="font-mono">HEC DL Connected</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Clean White Portal Card with Dual Authentication Methods */}
            <div className="md:col-span-6 bg-white p-6 sm:p-8 flex flex-col justify-between items-center text-center">
              
              <div className="w-full max-w-sm mx-auto my-auto space-y-4">
                
                {/* Shield Check Circular Badge */}
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-[#095733] shadow-xs">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>

                {/* Heading & Subtitle */}
                <div className="space-y-0.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    Welcome to PLiMS
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Pakistan Library Management System
                  </p>
                  <div className="w-10 h-0.5 bg-[#095733] rounded-full mx-auto mt-2" />
                </div>

                {/* ========================================================= */}
                {/* AUTHENTICATION METHOD 1: GOOGLE ACCOUNT LOGIN             */}
                {/* ========================================================= */}
                <div className="w-full space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Google Account Login</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">Fast 1-Click</span>
                  </div>
                  <GoogleLoginButton
                    variant="emerald"
                    text="Continue with Google"
                    activeBranch={selectedBranch}
                    onSuccess={handleGoogleSuccess}
                    onError={msg => setErrorMessage(msg)}
                    className="w-full py-2.5"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center my-2 w-full">
                  <div className="flex-1 border-t border-zinc-200" />
                  <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    OR
                  </span>
                  <div className="flex-1 border-t border-zinc-200" />
                </div>

                {/* ========================================================= */}
                {/* AUTHENTICATION METHOD 2: USERNAME + PASSWORD LOGIN        */}
                {/* ========================================================= */}
                <form onSubmit={handleUsernamePasswordLogin} className="w-full space-y-3 text-left">
                  <div className="space-y-1">
                    <label htmlFor="login-identifier" className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>Username / Member ID / Email</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-identifier"
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. admin@aijaz-edu.org or ADM-001"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" text-xs font-semibold text-zinc-700 className="text-xs font-semibold text-zinc-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPasswordModal(true);
                          setForgotFeedback(null);
                        }}
                        className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-9 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick Test Accounts Hint Pill */}
                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-500 space-y-1">
                    <div className="font-semibold text-zinc-600 flex items-center justify-between">
                      <span>Quick Test Accounts:</span>
                      <span className="text-emerald-700 font-bold">1-Click Fill</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier('admin@aijaz-edu.org');
                          setLoginPassword('admin123');
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-zinc-200 font-mono text-[10px] text-zinc-700 cursor-pointer"
                      >
                        Admin (admin@aijaz-edu.org / admin123)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier('sarah.jenkins@aijaz-edu.org');
                          setLoginPassword('lib123');
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-zinc-200 font-mono text-[10px] text-zinc-700 cursor-pointer"
                      >
                        Librarian (sarah.jenkins / lib123)
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#095733] hover:bg-[#074729] active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Verifying Credentials...' : 'Login'}</span>
                  </button>

                  {/* Create New Account Button */}
                  <button
                    id="btn-portal-register"
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setAuthMode('REGISTER');
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Create New Account</span>
                  </button>
                </form>

                {/* Back to Public OPAC link */}
                {onBackToOpac && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onBackToOpac}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Public OPAC Discovery</span>
                    </button>
                  </div>
                )}

                {/* Security Trust Indicator */}
                <div className="pt-1 flex items-center justify-center space-x-1.5 text-[11px] text-zinc-500">
                  <Shield className="w-3.5 h-3.5 text-[#095733] shrink-0" />
                  <span>Your data is safe and secure with PLiMS</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="w-full pt-4 text-center text-[11px] text-zinc-400 space-y-0.5">
                <p className="font-semibold text-zinc-600">PLiMS V4.1.1 PK edition</p>
                <p>Pakistan Library Management System</p>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: NEW USER REGISTRATION WORKFLOW (STRICTLY NON-ADMIN ROLES) */}
      {/* ========================================================================= */}
      {authMode === 'REGISTER' && (
        <main className="max-w-2xl w-full mx-auto my-auto py-6 z-10">
          <div className="bg-white text-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden p-6 sm:p-10">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-5 mb-6">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#095733] border border-emerald-100 text-xs font-bold mb-2">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Library Membership Application</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Create Your PLiMS Account</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Fill in your academic and contact details to register your member profile.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setAuthMode('PORTAL');
                }}
                className="text-zinc-400 hover:text-zinc-700 text-xs font-medium flex items-center gap-1 p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>

            {/* Fast Registration via Google */}
            <div className="mb-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <p className="text-xs font-semibold text-zinc-700 mb-2.5 text-center">
                Fast 1-Click Academic Registration with Google:
              </p>
              <GoogleLoginButton
                variant="emerald"
                text="Register with Google"
                activeBranch={selectedBranch}
                onSuccess={handleGoogleSuccess}
                onError={msg => setErrorMessage(msg)}
                className="w-full py-3"
              />
            </div>

            <div className="flex items-center my-5 w-full">
              <div className="flex-1 border-t border-zinc-200" />
              <span className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Or fill the registration form
              </span>
              <div className="flex-1 border-t border-zinc-200" />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
              
              {/* Full Legal Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-[#095733]" />
                  <span>Full Legal Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Fatima Zahra or Muhammad Bilal"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733]"
                />
              </div>

              {/* Email & Mobile Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="name@university.edu.pk"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Mobile Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733]"
                  />
                </div>
              </div>

              {/* User Type & Department Grid (NON-ADMIN ROLES ONLY) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#095733]" />
                    <span>User Type / Academic Category *</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733] cursor-pointer"
                  >
                    <option value="STUDENT">Student Member (Default)</option>
                    <option value="FACULTY">Faculty / Professor</option>
                    <option value="RESEARCH_SCHOLAR">Research Scholar / Postgrad</option>
                    <option value="GUEST">Community Patron / Guest</option>
                  </select>
                  <p className="text-[10px] text-zinc-400">
                    Administrative & Librarian accounts must be provisioned by System Admins.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Library Branch *</span>
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733] cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>
                        🏢 {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Academic Department */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  Academic Department / Faculty *
                </label>
                <input
                  type="text"
                  required
                  value={regDepartment}
                  onChange={e => setRegDepartment(e.target.value)}
                  placeholder="e.g. Computer Science, Medical Sciences, Management"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733]"
                />
              </div>

              {/* Password & Confirm Password (USER-DEFINED, NO DEFAULTS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Create Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733] pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-700"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Confirm Password *</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#095733] focus:ring-1 focus:ring-[#095733]"
                  />
                </div>
              </div>

              {/* Optional Photo Attachment */}
              <div className="pt-2">
                <MemberPhotoUploader
                  value={regAvatarUrl}
                  onChange={url => setRegAvatarUrl(url)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#095733] hover:bg-[#074729] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <span>Create Account & Access Library</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthMode('PORTAL');
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PUBLIC OPAC BOOK SEARCH & MARC21 RECORD VIEWER                    */}
      {/* ========================================================================= */}
      {authMode === 'OPAC' && (
        <main className="max-w-5xl w-full mx-auto my-6 space-y-6 z-10 flex-1">
          {/* OPAC Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                  Open Public Access
                </span>
                <span className="text-xs text-zinc-400">Union Catalog Search</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Public Online Catalog (OPAC)
              </h2>
              <p className="text-xs text-zinc-400 max-w-xl">
                Browse, search, and inspect physical holdings across all Pakistan Library Management System branches.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setAuthMode('PORTAL')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            </div>
          </div>

          {/* Search Controls */}
          <div className="p-4 rounded-2xl bg-[#121413] border border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={opacSearchQuery}
                onChange={e => setOpacSearchQuery(e.target.value)}
                placeholder="Search by Title, Author, ISBN, DDC Classification, or Subject..."
                className="w-full rounded-xl border border-zinc-700 bg-[#090b09] pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>

            <select
              value={opacDeptFilter}
              onChange={e => setOpacDeptFilter(e.target.value)}
              className="w-full sm:w-56 rounded-xl border border-zinc-700 bg-[#090b09] px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science & Information Technology">Computer Science & IT</option>
              <option value="Medical & Health Sciences">Medical & Health Sciences</option>
              <option value="Engineering & Applied Technology">Engineering & Tech</option>
              <option value="Business, Finance & Commerce">Business & Commerce</option>
              <option value="Social Sciences & Humanities">Humanities & Social Sciences</option>
            </select>
          </div>

          {/* Books List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpacBooks.map(book => (
              <div
                key={book.id}
                className="p-4 rounded-2xl bg-[#121413] border border-zinc-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {book.callNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        book.availableCopies > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'All Issued'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="text-xs text-zinc-400">
                    By {book.authors.join(', ')}
                  </p>

                  <div className="text-[11px] text-zinc-500 flex flex-wrap gap-2 pt-1">
                    <span>{book.publisherName} ({book.publisherYear})</span>
                    <span>•</span>
                    <span>{book.department}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedOpacBook(book)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>MARC21 Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('PORTAL');
                      setSuccessMessage(`To reserve "${book.title}", please authenticate via Google or register!`);
                    }}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Reserve Hold
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredOpacBooks.length === 0 && (
            <div className="p-12 rounded-3xl bg-[#121413] border border-zinc-800 text-center space-y-2">
              <Search className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-300">No matching books found</p>
              <p className="text-xs text-zinc-500">Try adjusting your search query or department filter.</p>
            </div>
          )}
        </main>
      )}

      {/* MARC21 Modal for OPAC Records */}
      {selectedOpacBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121413] p-6 shadow-2xl space-y-4 text-white relative">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400">Bibliographic Record</span>
                <h3 className="text-base font-bold text-white">{selectedOpacBook.title}</h3>
              </div>
              <button
                onClick={() => setSelectedOpacBook(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 max-h-96 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div><strong className="text-zinc-400">Authors:</strong> {selectedOpacBook.authors.join(', ')}</div>
                <div><strong className="text-zinc-400">ISBN:</strong> {selectedOpacBook.isbn}</div>
                <div><strong className="text-zinc-400">Call Number:</strong> {selectedOpacBook.callNumber}</div>
                <div><strong className="text-zinc-400">Shelf Location:</strong> {selectedOpacBook.shelfLocation}</div>
                <div><strong className="text-zinc-400">Total Copies:</strong> {selectedOpacBook.totalCopies}</div>
                <div><strong className="text-zinc-400">Available:</strong> {selectedOpacBook.availableCopies}</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] space-y-1">
                <p className="text-emerald-400 font-bold mb-1">MARC21 Standard Fields:</p>
                <p>020 ## $a {selectedOpacBook.isbn}</p>
                <p>082 04 $a {selectedOpacBook.callNumber.split(' ')[0]}</p>
                <p>100 1# $a {selectedOpacBook.authors[0]}</p>
                <p>245 10 $a {selectedOpacBook.title}</p>
                <p>260 ## $a {selectedOpacBook.publisherLocation} $b {selectedOpacBook.publisherName} $c {selectedOpacBook.publisherYear}</p>
                <p>300 ## $a {selectedOpacBook.pageCount} p.</p>
                <p>650 #0 $a {selectedOpacBook.subjects.join(' $a ')}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOpacBook(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto mt-6 pt-4 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 z-10">
        <div className="flex items-center space-x-2">
          <span>Pakistan Library Management System (PLiMS V4.1.1 PK edition)</span>
          <span>•</span>
          <span>ISO 27001 & HEC Compliant</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowLicenseModal(true)}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Software License & Terms
          </button>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Portal Online
          </span>
        </div>
      </footer>

      {/* Software License Modal */}
      <LicenseModal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} />

      {/* Forgot Password / Account Recovery Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => {
                setShowForgotPasswordModal(false);
                setForgotFeedback(null);
                setForgotIdentifier('');
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">PLiMS Account Recovery</h3>
                <p className="text-xs text-zinc-400">Verify your registered institutional account</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Institutional security policies govern PLiMS accounts. Enter your registered email address or Member Code to check your status or receive recovery instructions.
            </p>

            <form onSubmit={handleForgotLookup} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Registered Email or Member Code
                </label>
                <input
                  type="text"
                  required
                  value={forgotIdentifier}
                  onChange={e => setForgotIdentifier(e.target.value)}
                  placeholder="e.g. admin@aijaz-edu.org or LIB-101"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {forgotFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    forgotFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  }`}
                >
                  {forgotFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  )}
                  <span className="leading-relaxed">{forgotFeedback.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotFeedback(null);
                    setForgotIdentifier('');
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#095733] hover:bg-[#074729] text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                >
                  Verify Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Digital Librarian Chatbot Assistant */}
      <DigitalLibrarianChatbot
        currentUser={users[0] || undefined}
        books={books}
        users={users}
        branches={branches}
      />
    </div>
  );
};
