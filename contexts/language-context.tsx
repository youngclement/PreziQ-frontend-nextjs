'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import Cookies from 'js-cookie';

// Define the language context type
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, options?: { [key: string]: string }) => string;
};

// Create the language context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Define the props for the language provider
type LanguageProviderProps = {
  children: ReactNode;
};

// Initialize i18next
i18next
  .use(I18nextBrowserLanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie'],
    },
    resources: {
      en: {
        translation: {
          // Navigation
          features: 'Features',
          useCase: 'Use Cases',
          pricing: 'Pricing',
          achievements: 'Achievements',
          testimonials: 'Testimonials',
          faq: 'FAQ',
          blog: 'Blog',
          signIn: 'Sign In',
          signUp: 'Sign Up Free',

          // Features submenu
          aiPresentationBuilder: 'AI Presentation Builder',
          designTemplates: 'Design Templates',
          realtimeCollaboration: 'Real-time Collaboration',

          // Use Cases submenu
          marketingTeams: 'Marketing Teams',
          salesProfessionals: 'Sales Professionals',
          education: 'Education',

          // Hero Section
          heroTitle: 'Present Like a',
          presentationTitle: 'Professional',
          heroSubtitle:
            "Elevate presentations with PreziQ!'s interactive, real-time gamified platform",
          getStarted: 'Get Started',
          learnMore: 'Learn More',

          // Features Section
          featuresTitle: 'Powerful Features',
          featureOneTitle: 'Engage Your Audience with Interactive Slides',
          featureOneDesc:
            'Create dynamic presentations that captivate your audience with interactive elements, polls, and real-time feedback.',
          featureTwoTitle: 'Game-Based Learning Made Simple',
          featureTwoDesc:
            'Turn any presentation into an engaging quiz game similar to Kahoot, with leaderboards and team competitions.',
          featureThreeTitle:
            "Elevate Your Presentations with PreziQ's Game-Based Learning Tools",
          featureThreeDesc:
            'Join thousands of educators and presenters who have transformed their content using our interactive presentation and game-based learning platform.',

          // Testimonials Section
          testimonialsTitle: 'What Our Users Say',
          testimonialDesc: 'Thousands of teams and individuals trust PreziQ',
          testimonialAuthor1: 'Quách Phú Thuận',
          testimonialRole1: 'Marketing Director',
          testimonialText1:
            'PreziQ transformed our marketing presentations. The AI features saved us countless hours and the interactive elements keep our audience engaged.',
          testimonialAuthor2: 'Lê Trần Hoàng Kiên',
          testimonialRole2: 'University Professor',
          testimonialText2:
            'The game-based learning features have completely changed how I teach. My students are more engaged and retain information better.',
          testimonialAuthor3: 'Lê Phạm Thanh Duy',
          testimonialRole3: 'Sales Executive',
          testimonialText3:
            'Our conversion rates have increased by 40% since we started using PreziQ for sales presentations. The interactive features make all the difference.',

          testimonialAuthor4: 'Trần Nguyễn Minh Quân',
          testimonialRole4: 'Marketing Director',
          testimonialText4:
            'PreziQ transformed our marketing presentations. The AI features saved us countless hours and the interactive elements keep our audience engaged.',
          testimonialAuthor5: 'Cao Bảo Gia Luật',
          testimonialRole5: 'University Professor',
          testimonialText5:
            'The game-based learning features have completely changed how I teach. My students are more engaged and retain information better.',

          // Text Marquee Section
          trustedBy: 'Trusted by innovative companies worldwide',
          marqueeTextFirst: 'Create Impressive Presentations with PreziQ',
          marqueeTextSecond:
            'Engage Your Audience • Deliver Your Message • Stand Out',

          // Newsletter Section
          newsletterTitle: 'Stay Updated',
          newsletterDesc:
            'Subscribe to our newsletter to get the latest updates',
          emailPlaceholder: 'Enter your email',
          subscribe: 'Subscribe',
          privacyStatement: 'We respect your privacy. Unsubscribe at any time.',
          newsletterBadge: 'PreziQ Newsletter',
          newsletterHighlight: 'insights & templates',
          newsletterImageAlt: 'Stay connected with PreziQ newsletter',
          over: 'Over',
          presentationPros: 'presentation pros',
          alreadySubscribed: 'have already subscribed.',
          and: 'and',

          // Demo UI Section
          demoTitle: 'Try it Yourself',
          demoSubtitle:
            'See how easy it is to create interactive presentations',
          demoButton: 'View Demo',
          demoImageAlt: 'PreziQ presentation demo',

          // Quiz Demo Section
          quizTypes: 'Interactive Quiz Gallery',
          'quiz.exploreTitle': 'Explore ',
          'quiz.quizFormats': 'Quiz Formats',
          'quiz.mainDescription':
            'From multiple choice to location questions, create rich interactive learning experiences with PreziQ',
          'quiz.demo': 'Demo',
          'quiz.typeAnswer': 'Type your answer here...',
          'quiz.correctAnswer': 'Correct answer:',
          'quiz.dragToReorder': 'Drag to reorder the items',
          'quiz.interactiveMap': 'Interactive Map',
          'quiz.clickToIdentify': 'Click to identify:',
          'quiz.countries': 'Countries',
          'quiz.capitals': 'Capitals',
          'quiz.dragToConnect': 'Drag to connect',
          'quiz.educationalContent': 'Educational Content',
          'quiz.webDevContent':
            'Web development is the process of building websites and web applications...',
          'quiz.question.multiple-choice': 'What is the capital of France?',
          'quiz.question.multiple-response':
            'Which of these are programming languages?',
          'quiz.question.true-false':
            'The Earth is the third planet from the Sun.',
          'quiz.question.type-answer': 'What is 15 + 27?',
          'quiz.question.reorder':
            'Arrange these events in chronological order:',
          'quiz.question.location': 'Where is the Eiffel Tower located?',
          'quiz.question.matching-pairs':
            'Match the countries with their capitals:',
          'quiz.question.info-slide': 'Introduction to Web Development',
          'quiz.title.multiple-choice': 'Multiple Choice Quiz',
          'quiz.title.multiple-response': 'Multiple Response Quiz',
          'quiz.title.true-false': 'True or False Quiz',
          'quiz.title.type-answer': 'Type Answer Quiz',
          'quiz.title.reorder': 'Reorder Quiz',
          'quiz.title.location': 'Location Quiz',
          'quiz.title.matching-pairs': 'Matching Pairs Quiz',
          'quiz.title.info-slide': 'Info Slide',
          'quiz.description.multiple-choice':
            'Students select one correct answer from multiple options',
          'quiz.description.multiple-response':
            'Students can select multiple correct answers',
          'quiz.description.true-false': 'Simple binary choice questions',
          'quiz.description.type-answer':
            'Students type their answer in a text field',
          'quiz.description.reorder':
            'Students arrange items in the correct order',
          'quiz.description.location':
            'Students identify locations on an interactive map',
          'quiz.description.matching-pairs':
            'Students connect related items from two columns',
          'quiz.description.info-slide':
            'Present information without quiz interaction',
          'quiz.type.quiz_buttons': 'Multiple choice',
          'quiz.type.quiz_checkboxes': 'Multiple response',
          'quiz.type.quiz_true_or_false': 'True or false',
          'quiz.type.quiz_type_answer': 'Type answer',
          'quiz.type.quiz_reorder': 'Reorder',
          'quiz.type.quiz_location': 'Location',
          'quiz.type.quiz_matching_pairs': 'Matching pairs',
          'quiz.type.info_slide': 'Info slide',
          'quiz.features.singleChoice': 'Select one correct answer only',
          'quiz.features.intuitive': 'Intuitive and easy-to-use interface',
          'quiz.features.basicKnowledge': 'Perfect for basic knowledge testing',
          'quiz.features.multipleChoice': 'Select multiple correct answers',
          'quiz.features.comprehensive':
            'Comprehensive understanding assessment',
          'quiz.features.flexibleScoring': 'Flexible scoring system',
          'quiz.features.binaryChoice': 'Simple binary choice',
          'quiz.features.quickAssessment': 'Quick assessment tool',
          'quiz.features.easyParticipation': 'Easy participation for students',
          'quiz.features.textInput': 'Free text input',
          'quiz.features.openAnswers': 'Open-ended answers',
          'quiz.features.flexibleResponse': 'Flexible response format',
          'quiz.features.dragDrop': 'Drag and drop interface',
          'quiz.features.sequentialLearning': 'Sequential learning support',
          'quiz.features.orderConcepts': 'Order concepts logically',
          'quiz.features.interactiveMap': 'Interactive map integration',
          'quiz.features.geographyLearning': 'Engaging geography learning',
          'quiz.features.multipleMarkers': 'Multiple marker support',
          'quiz.features.connectItems': 'Connect related items',
          'quiz.features.associativeLearning': 'Learning through association',
          'quiz.features.bidirectionalInteraction': 'Bidirectional interaction',
          'quiz.features.clearPresentation': 'Clear information presentation',
          'quiz.features.educationalSupport': 'Educational content support',
          'quiz.features.noInteractionNeeded': 'No interaction required',
          'quiz.tryNow.multiple-choice': 'Try Multiple Choice Now',
          'quiz.tryNow.multiple-response': 'Try Multiple Response Now',
          'quiz.tryNow.true-false': 'Try True/False Now',
          'quiz.tryNow.type-answer': 'Try Type Answer Now',
          'quiz.tryNow.reorder': 'Try Reorder Now',
          'quiz.tryNow.location': 'Try Location Now',
          'quiz.tryNow.matching-pairs': 'Try Matching Pairs Now',
          'quiz.tryNow.info-slide': 'Try Info Slide Now',
          'quiz.readyToCreate': 'Ready to Create Your Quiz?',
          'quiz.ctaDescription':
            'Start creating engaging interactive quizzes with PreziQ today',
          'quiz.startCreating': 'Start Creating Quiz',

          // FAQ Section
          faqTitle: 'Frequently Asked Questions',
          faqDesc: 'Find answers to common questions',
          faq1Question: 'How does the AI presentation builder work?',
          faq1Answer:
            'Our AI analyzes your content and automatically generates professional slides with appropriate layouts, graphics, and transitions based on your text input.',
          faq2Question: 'Can I collaborate with my team in real-time?',
          faq2Answer:
            'Yes! Multiple team members can work on the same presentation simultaneously with all changes synced in real-time.',
          faq3Question: 'How do the interactive game features work?',
          faq3Answer:
            'You can transform any presentation into an interactive quiz or game. Participants join using their mobile devices and compete in real-time.',
          faq4Question: 'Is there a free plan available?',
          faq4Answer:
            'Yes, we offer a free tier with basic features. Premium plans unlock advanced AI capabilities and interactive elements.',
          faq5Question: 'Can I import existing PowerPoint presentations?',
          faq5Answer:
            "Absolutely! You can import PowerPoint files and enhance them with PreziQ's interactive features and AI improvements.",
          viewAllFaqs: 'View all FAQs',
          stillHaveQuestions: 'Still have questions?',
          cantFindAnswer:
            "Can't find the answer you're looking for? Please chat with our friendly team.",
          chatWithSupport: 'Chat with Support',

          // Footer
          footerTitle: 'PreziQ',
          footerDesc: 'The AI-powered presentation platform',
          company: 'Company',
          about: 'About',
          careers: 'Careers',
          contact: 'Contact',
          legal: 'Legal',
          privacy: 'Privacy Policy',
          terms: 'Terms of Service',
          copyright: '© 2023 PreziQ. All rights reserved.',
          footerNavigation: 'Navigation',
          footerConnect: 'Connect',
          footerVision: 'Our Vision',
          footerVisionDesc:
            'Pioneering the next generation of web experiences through innovative code and cutting-edge design.',
          footerHome: 'Home',
          footerAbout: 'About',
          footerServices: 'Services',
          footerProjects: 'Projects',
          footerBlog: 'Blog',
          footerContact: 'Contact',
          footerlinkedin: 'LinkedIn',
          footertwitter: 'Twitter',
          footerinstagram: 'Instagram',
          footergithub: 'GitHub',

          // User Auth
          email: 'Email',
          password: 'Password',
          firstName: 'First Name',
          lastName: 'Last Name',
          phoneNumber: 'Phone Number',
          forgotPassword: 'Forgot Password?',
          dontHaveAccount: "Don't have an account?",
          alreadyHaveAccount: 'Already have an account?',
          createAccount: 'Create Account',
          name: 'Name',
          confirmPassword: 'Confirm Password',

          // Language Switcher
          selectLanguage: 'Select language',
          changeLanguage: 'Change language',

          // Navigation Compact Mode
          showMenu: 'Show Menu',
          hideMenu: 'Hide Menu',

          // Common
          loading: 'Loading...',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          back: 'Back',
          next: 'Next',
          submit: 'Submit',
          search: 'Search for presentations...',
          filterBy: 'Filter by',
          sortBy: 'Sort by',

          // Dashboard translations
          user: 'User',
          companyABC: 'Company ABC',
          enterprise: 'Enterprise',
          startupXYZ: 'Startup XYZ',
          startup: 'Startup',
          general: 'General',
          dashboard: 'Dashboard',
          chat: 'Chat',
          administration: 'Administration',
          roles: 'Roles',
          permissions: 'Permissions',
          users: 'Users',
          achievement: 'Achievements',

          // Dashboard Overview
          totalRevenue: 'Total Revenue',
          subscriptions: 'Subscriptions',
          sales: 'Sales',
          activeNow: 'Active Now',
          overview: 'Overview',
          recentSales: 'Recent Sales',
          salesThisMonth: 'You made 265 sales this month.',
          fromLastMonth: 'from last month',
          sinceLastHour: 'since last hour',

          // Role Management
          roleManagement: 'Role Management',
          roleManagementDesc: 'Manage user roles and permissions here.',
          roleStatus: {
            title: 'Status',
            active: 'Active',
            inactive: 'Inactive',
          },
          searchPlaceholder: 'Search roles...',
          reset: 'Reset',

          // User Management
          userType: {
            superadmin: 'Superadmin',
            admin: 'Admin',
            manager: 'Manager',
            cashier: 'Cashier',
          },
          userStatus: {
            active: 'Active',
            inactive: 'Inactive',
            invited: 'Invited',
            suspended: 'Suspended',
          },

          // Common Actions
          download: 'Download',
          select: 'Select',
          continue: 'Continue',
          apply: 'Apply',
          clear: 'Clear',
          filterPlaceholder: 'Filter...',
          sortPlaceholder: 'Sort by...',
          selectPlaceholder: 'Select...',
          datePlaceholder: 'Select date...',
          timePlaceholder: 'Select time...',
          noOptions: 'No options available',
          loadingOptions: 'Loading options...',
          errorLoadingOptions: 'Error loading options',
          retryLoading: 'Retry',
          noData: 'No data available',
          loadingMore: 'Loading more...',
          loadMore: 'Load more',
          endOfList: 'End of list',
          noMoreData: 'No more data',
          errorLoadingMore: 'Error loading more data',
          retryLoadingMore: 'Retry loading more',
          noResultsFound: 'No results found',
          tryDifferentKeywords: 'Try different keywords',
          clearFilters: 'Clear filters',
          applyFilters: 'Apply filters',
          resetFilters: 'Reset filters',
          selectAllFilters: 'Select all filters',
          deselectAllFilters: 'Deselect all filters',
          selectedFilters: 'Selected filters',
          clearSelection: 'Clear selection',
          selectAllItems: 'Select all items',
          deselectAllItems: 'Deselect all items',
          selectedItems: 'Selected items',
          applyToSelected: 'Apply to selected',
          cancelSelection: 'Cancel selection',
          confirmSelection: 'Confirm selection',
          selectAtLeastOne: 'Please select at least one item',
          selectAtMostOne: 'Please select at most one item',
          selectExactlyOne: 'Please select exactly one item',
          selectBetween: 'Please select between {min} and {max} items',
          selectMin: 'Please select at least {min} items',
          selectMax: 'Please select at most {max} items',
          selectExact: 'Please select exactly {count} items',
          selectRange: 'Please select items in range {start} to {end}',
          selectAll: 'Select all',
          deselectAll: 'Deselect all',
          invertSelection: 'Invert selection',
          selectNone: 'Select none',
          selectSome: 'Select some',
          selectMany: 'Select many',
          selectFew: 'Select few',
          selectOne: 'Select one',
          selectTwo: 'Select two',
          selectThree: 'Select three',
          selectFour: 'Select four',
          selectFive: 'Select five',
          selectSix: 'Select six',
          selectSeven: 'Select seven',
          selectEight: 'Select eight',
          selectNine: 'Select nine',
          selectTen: 'Select ten',

          // User Menu
          upgradeToPro: 'Upgrade to Pro',
          account: 'Account',
          payment: 'Payment',
          notifications: 'Notifications',
          logout: 'Logout',

          // Forgot Password
          forgotPasswordTitle: 'Forgot Password',
          forgotPasswordDescription:
            'Enter your email to receive a password reset link.',
          sendResetLink: 'Send Reset Link',
          sending: 'Sending...',
          forgotPasswordFailed: 'Forgot Password Failed',
          forgotPasswordGenericError: 'An error occurred, please try again.',
          emailPlaceholderForgot: 'name@example.com',

          // Register Page
          welcome: 'Welcome',
          joinPreziQ:
            'Join PreziQ to explore amazing presentations and connect with like-minded creators.',
          firstNameRequired: 'First name is required',
          lastNameRequired: 'Last name is required',
          phoneNumberRequired: 'Phone number is required',
          passwordRequired: 'Password is required',
          confirmPasswordRequired: 'Confirm password is required',
          byCreatingAccount: 'By creating an account, you agree to our',
          termsAndConditions: 'terms and conditions',
          privacyPolicy: 'privacy policy',
          createAnAccount: 'Create an account',
          logIn: 'Log in',
          phoneNumberPlaceholder: 'e.g., 0886332809',
          emailRequired: 'Email is required',

          // New achievements translations
          achievementName: 'Achievement Name',
          achievementDescription: 'Description',
          achievementRequiredPoints: 'Required Points',
          achievementCreatedAt: 'Created At',
          achievementSearchPlaceholder: 'Search achievements...',
          achievementNoResults: 'No results found',
          achievementAdd: 'Add Achievement',
          achievementEdit: 'Edit',
          achievementDelete: 'Delete',
          achievementRefresh: 'Refresh',
          achievementBasicInfo: 'Basic Information',
          achievementNamePlaceholder: 'Enter achievement name',
          achievementDescriptionPlaceholder: 'Enter achievement description',
          achievementRequiredPointsPlaceholder: 'Enter required points',
          achievementIcon: 'Achievement Icon',
          achievementUploadIcon: 'Upload Icon',
          achievementUploading: 'Uploading...',
          achievementFileFormat: 'Format: JPG, JPEG, PNG, SVG (max 5MB)',
          achievementEditTitle: 'Edit Achievement',
          achievementAddTitle: 'Add New Achievement',
          achievementEditDesc: 'Update current achievement information',
          achievementAddDesc:
            'Fill in all information to create a new achievement',
          achievementCancel: 'Cancel',
          achievementSubmit: 'Submit',
          achievementUpdating: 'Updating...',
          achievementConfirmDelete: 'Confirm delete achievement',
          achievementDeleteDesc:
            'This action cannot be undone. The achievement will be permanently deleted.',
          achievementDeleteWarn: 'Are you sure you want to delete achievement',
          achievementDeleteWarn2: 'All related data will be lost.',
          achievementDeleting: 'Deleting...',
          achievementDeleteBtn: 'Delete Achievement',
          achievementSelect: 'Select',
          achievementClearSearch: 'Clear search',
          achievementClearFilter: 'Clear filter',
          achievementPointsLt100: '< 100 points',
          achievementPoints100_500: '100 - 500 points',
          achievementPoints500_1000: '500 - 1000 points',
          achievementPointsGt1000: '> 1000 points',
          achievementLoadError: 'Failed to load achievements list',
          success: 'Success',
          achievementCreateSuccess: 'Achievement created successfully',
          achievementUpdateSuccess: 'Achievement updated successfully',
          achievementDeleteSuccess: 'Achievement deleted successfully',
          error: 'Error',
          achievementManagement: 'Achievement Management',
          achievementManagementDesc: 'Manage user achievements here.',
          permissionsManagement: 'Permissions Management',
          permissionsManagementDesc: 'Manage system permissions here.',

          // Table related translations
          tableNoData: 'No data available',
          tableLoading: 'Loading...',
          tableError: 'Error loading data',
          tableRefresh: 'Refresh',
          tableSearch: 'Search',
          tableFilter: 'Filter',
          tableSort: 'Sort',
          tableView: 'View',
          tableColumns: 'Columns',
          tablePagination: {
            showing: 'Showing',
            to: 'to',
            of: 'of',
            entries: 'entries',
            previous: 'Previous',
            next: 'Next',
            first: 'First',
            last: 'Last',
            rowsPerPage: 'Rows per page',
            page: 'Page',
          },
          // Module related translations
          moduleName: 'Module Name',
          moduleDescription: 'Description',
          moduleAdd: 'Add Module',
          moduleEdit: 'Edit Module',
          moduleDelete: 'Delete Module',
          moduleCreateSuccess: 'Module created successfully',
          moduleUpdateSuccess: 'Module updated successfully',
          moduleDeleteSuccess: 'Module deleted successfully',
          moduleDeleteError: 'Failed to delete module',
          moduleLoadError: 'Failed to load modules list',
          // Tree related translations
          treeDragToReorder: 'Drag to reorder',
          treeExpandAll: 'Expand All',
          treeCollapseAll: 'Collapse All',

          // Module Management
          moduleManagement: 'Module Management',
          moduleManagementDesc: 'Manage system modules here.',
          moduleNamePlaceholder: 'Enter module name',
          moduleDescriptionPlaceholder: 'Enter module description',
          moduleAddTitle: 'Add New Module',
          moduleEditTitle: 'Edit Module',
          moduleAddDesc: 'Fill in all information to create a new module',
          moduleEditDesc: 'Update current module information',
          moduleBasicInfo: 'Basic Information',
          modulePermissions: 'Module Permissions',
          moduleSelectPermissions: 'Select permissions for this module',

          // Module Status
          moduleCreating: 'Creating...',
          moduleUpdating: 'Updating...',
          moduleDeleting: 'Deleting...',
          moduleConfirmDelete: 'Confirm delete module',
          moduleDeleteDesc:
            'This action cannot be undone. The module will be permanently deleted.',
          moduleDeleteWarn: 'Are you sure you want to delete module',
          moduleDeleteWarn2: 'All related permissions will be lost.',

          // Icon Upload Related
          iconUpload: {
            title: 'Icon',
            preview: 'Icon preview',
            urlPlaceholder: 'https://example.com/icon.png',
            uploadButton: 'Upload icon',
            uploading: 'Uploading...',
            fileInfo: 'File info',
            fileSize: 'KB',
            formatInfo: 'Format: JPG, JPEG, PNG, SVG (max 5MB)',
            dragDrop: 'Drag and drop your icon here',
            or: 'or',
            browse: 'Browse files',
            remove: 'Remove icon',
            error: {
              size: 'File size exceeds 5MB limit',
              format:
                'Invalid file format. Please upload JPG, JPEG, PNG or SVG',
              upload: 'Failed to upload icon',
            },
          },

          // New translations
          selectedCount: 'selected',
          noPermissionsFound: 'No matching permissions found',
          httpMethod: 'HTTP Method',
          apiPath: 'API Path',
          submitting: 'Submitting...',
          sortAscending: 'Sort ascending',
          sortDescending: 'Sort descending',
          hideColumn: 'Hide column',
          moduleList: 'Module List',
          createPermission: 'Create Permission',
          createModule: 'Create Module',
          otherPermissions: 'Other Permissions',
          dragPermissionHere: 'Drag permission here to remove from module',
          updateModuleSuccess: 'Module updated successfully',
          updateModuleError: 'Failed to update module for permission',
          errorOccurred: 'An error occurred',

          // Role Management

          // Add new translations for row actions
          openMenu: 'Open menu',

          view: 'View',
          actions: 'Actions',
          confirmDelete: 'Confirm Delete',
          deleteConfirmation: 'Are you sure you want to delete this item?',

          confirm: 'Confirm',

          column: {
            name: 'Role Name',
            description: 'Description',
            permissions: 'Permissions Count',
            status: 'Status',
            createdAt: 'Created At',
            createdBy: 'Created By',
            actions: 'Actions',
            select: 'Select',
            active: {
              active: 'Active',
              inactive: 'Inactive',
            },
          },

          roleDeleteSuccess: 'Role {{roleName}} has been deleted successfully.',
          roleDeleteError: 'Failed to delete role. Please try again later.',
          roleDeleteConfirmation:
            'This action will permanently delete role "{{roleName}}" and cannot be undone.',
          enterRoleNameToConfirm: 'Enter "{{roleName}}" to confirm:',
          enterRoleNamePlaceholder: 'Enter role name to confirm deletion',
          warning: 'Warning!',
          roleDeleteWarning:
            'Deleting this role will remove all associated permissions and may affect users assigned to this role.',
          roleNameRequired: 'Role name is required',
          descriptionRequired: 'Description is required',
          permissionRequired: 'At least one permission is required',
          editRole: 'Edit Role',
          addNewRole: 'Add New Role',
          editRoleDesc: 'Edit role information and permissions',
          addNewRoleDesc: 'Create new role with specified permissions',
          basicInfo: 'Basic Information',
          roleName: 'Role Name',
          enterRoleName: 'Enter role name',
          description: 'Description',
          enterRoleDescription: 'Enter role description',
          status: 'Status',
          role: 'Role',
          active: 'Active',
          inactive: 'Inactive',
          update: 'Update',
          add: 'Add',

          // User Management
          userManagement: {
            uploadAvatar: 'Upload avatar',
            avatarFormat: 'Format: JPG, JPEG, PNG (1KB - 5MB)',
            title: 'User Management',
            description: 'Manage users in the system here',
            addUser: 'Add User',
            inviteUser: 'Invite User',
            editUser: 'Edit User',
            deleteUser: 'Delete User',
            basicInfo: 'Basic Information',
            additionalInfo: 'Additional Information',
            imageAndPermissions: 'Image & Permissions',
            emailVerification: 'Email Verification',
            verified: 'Verified',
            unverified: 'Unverified',
            userVerified: 'User has verified email',
            userUnverified: 'User has not verified email',
            cancel: 'Cancel',
            update: 'Update',
            add: 'Add',
            delete: 'Delete',
            processing: 'Processing...',
            confirmDelete: 'Confirm Delete',
            deleteConfirmation:
              'This action will permanently delete this user. Please enter email to confirm deletion.',
            enterEmailToConfirm: 'Enter email to confirm',
            noChanges: 'No information has been changed.',
            error: 'Error',
            errorOccurred: 'An error occurred',
            success: 'Success',
            inviteSuccess: 'Invitation sent successfully',
            inviteError: 'Could not send invitation',
            cropAvatar: 'Crop Avatar',
            cropAvatarDesc:
              'Kéo và thả để cắt ảnh đại diện của bạn. Nhấn "Lưu" để áp dụng.',
            zoom: 'Zoom',
            cropAndUpload: 'Crop and Upload',
            columns: {
              avatar: 'Avatar',
              email: 'Email',
              firstName: 'First Name',
              lastName: 'Last Name',
              isVerified: 'Verification Status',
              roles: 'Roles',
              createdAt: 'Created At',
            },
            verification: {
              verified: 'Verified',
              unverified: 'Unverified',
            },
            table: {
              noResults: 'No results found',
              error: {
                title: 'An error occurred while displaying data',
                refresh: 'Please try refreshing the page',
              },
            },
            roles: {
              admin: 'Administrator',
              user: 'User',
              editor: 'Editor',
              viewer: 'Viewer',
              manager: 'Manager',
            },
            editUserDesc: 'Update current user information',
            addUserDesc: 'Fill in all information to create a new user',
            phoneNumber: 'Phone Number',
            phoneNumberPlaceholder: 'Enter phone number',
            lastNamePlaceholder: 'Enter last name',
            firstNamePlaceholder: 'Enter first name',
            nickname: 'Nickname',
            nicknamePlaceholder: 'Enter nickname',
            birthDate: 'Birth Date',
            birthDatePlaceholder: 'Select birth date',
            gender: 'Gender',
            genderPlaceholder: 'Select gender',
            genderOptions: {
              male: 'Male',
              female: 'Female',
              other: 'Other',
            },
            nationality: 'Nationality',
            nationalityPlaceholder: 'Enter nationality',
            avatar: 'Avatar',
            role: 'Role',
            rolePlaceholder: 'Select role',
          },

          // Data Table Faceted Filter
          searchByEmail: 'Search by email...',
          verificationStatus: 'Verification Status',
          verified: 'Verified',
          unverified: 'Unverified',
          toggleColumns: 'Toggle Columns',

          // Collection Form
          collectionForm: {
            title: 'Create New Collection',
            subtitle: 'Build an amazing collection for your viewers',
            editTitle: 'Edit Collection',
            editSubtitle: 'Update the information for your collection',
            titleLabel: 'Title',
            titlePlaceholder: 'Enter collection title',
            titleDescription: 'Keep it short and memorable',
            topicLabel: 'Topic',
            topicPlaceholder: 'Select topic',
            topicDescription: 'Choose a topic that matches your content',
            backgroundMusicLabel: 'Background Music',
            backgroundMusicPlaceholder:
              'Enter music file name (e.g., technology.mp3)',
            backgroundMusicDescription: 'Background music during presentation',
            descriptionLabel: 'Description',
            descriptionPlaceholder: 'Describe your collection',
            descriptionDescription: 'What makes this collection special?',
            publishLabel: 'Publish Collection',
            publishDescription: 'Make it visible to everyone',
            expertTips: 'Expert Tips',
            tips: [
              'Choose an impressive title',
              'Write a clear and engaging description',
              'Select a topic that matches your content',
              'Use high-quality, relevant images',
              'A default check activity will be automatically created when creating a collection',
              'Only publish when ready',
            ],
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            update: 'Update',
            updating: 'Updating...',
            importantNote: {
              title: 'Important Note',
              content:
                'When creating a new collection, the system will automatically add a default check activity. You can edit or delete this activity after creating the collection.',
              editContent:
                'When editing the collection, existing quiz activities will be preserved. You can manage activities after updating the collection.',
              requiredFields:
                'Required fields: Title, Description, Cover Image, Topic',
            },
            toast: {
              creating: {
                title: 'Creating collection...',
                description: 'Please wait while we create your collection.',
              },
              success: {
                title: 'Collection created!',
                description: 'Your collection has been created successfully.',
              },
              error: {
                title: 'Error creating collection',
                description: 'An error occurred. Please try again later.',
              },
            },
            imageUpload: {
              label: 'Cover Image',
              description:
                'Upload a cover image for your collection (recommended size: 1200x630px)',
              urlPlaceholder:
                'Paste image URL (e.g., https://example.com/image.jpg)',
              uploadButton: 'Upload image',
              uploading: 'Uploading...',
              cropTitle: 'Crop cover image',
              cropButton: 'Crop and upload',
              cancelButton: 'Cancel',
              zoomLabel: 'Zoom:',
              previewText: 'Image preview',
              recommendedSize: 'Recommended: 1200x630px',
              invalidFormat: 'Invalid file format',
              invalidFormatDesc: 'Please upload an image file',
              fileTooLarge: 'File too large',
              fileTooLargeDesc: 'Please upload an image smaller than 5MB',
              fileTooSmall: 'File too small',
              fileTooSmallDesc: 'Please upload an image larger than 1KB',
              uploadSuccess: 'Success',
              uploadSuccessDesc: 'Cover image uploaded successfully',
              uploadError: 'Error',
              uploadErrorDesc:
                'An error occurred while uploading. Please try again.',
              noFileUrl: 'No file URL found in response',
            },
            uploadMusic: 'Upload Music',
            selectedMusic: 'Selected Music',
          },

          // Session History
          sessionHistory: {
            title: 'Session History',
            subtitle: 'View all your past and active sessions',
            totalSessions: 'Total Sessions',
            activeSessions: 'Active Sessions',
            completedSessions: 'Completed Sessions',
            averageDuration: 'Average Duration',
            status: {
              active: 'Active',
              ended: 'Ended',
              pending: 'Pending',
              cancelled: 'Cancelled',
            },
            duration: {
              ongoing: 'Ongoing',
              lessThan30Seconds: '< 30 seconds',
              lessThan1Minute: '< 1 minute',
              minutes: 'minutes',
              hours: 'hours',
              days: 'days',
              minutes_plural: 'minutes',
              hours_plural: 'hours',
              days_plural: 'days',
              unknown: 'Unknown',
            },
            table: {
              status: 'Status',
              sessionCode: 'Session Code',
              collectionTitle: 'Collection Title',
              startTime: 'Start Time',
              duration: 'Duration',
              actions: 'Actions',
              details: 'Details',
            },
            noSessions: {
              title: 'No sessions found',
              description:
                "You don't have any session history yet. Start a new session to engage with your audience.",
              goToDashboard: 'Go to Dashboard',
            },
            error: {
              fetchFailed:
                'Failed to fetch session history. Please try again later.',
              sessionNotFound: 'Session not found',
              participantsFailed:
                'Failed to fetch participants. Please try again later.',
              submissionsFailed:
                'Failed to fetch participant answers. Please try again later.',
            },
            detail: {
              backToHistory: 'Back to Session History',
              sessionOverview: 'Session Overview',
              duration: 'Duration',
              participants: 'Participants',
              host: 'Host',
              leaderboard: 'Leaderboard',
              analytics: 'Analytics',
              participantDetails: 'Participant Details',
              overallStats: 'Overall Performance Statistics',
              questionPerformance: 'Question Performance Analysis',
              participantPerformance: 'Participant Performance Breakdown',
              correctAnswers: 'Correct Answers',
              incorrectAnswers: 'Incorrect Answers',
              notAnswered: 'Not Answered',
              score: 'Score',
              rank: 'Rank',
              totalQuestions: 'Total Questions',
              answered: 'Answered',
              accuracy: 'Accuracy',
              avgResponseTime: 'Avg Response Time',
              noParticipants: 'No participants found',
              noSubmissions: 'No submissions found',
              selectParticipant: 'Select a participant to view details',
              submissionDetails: 'Submission Details',
              tabs: {
                leaderboard: 'Leaderboard',
                analytics: 'Analytics',
                participants: 'Participants',
              },
            },
          },

          // Session Join Page
          session: {
            connecting: 'Connecting...',
            connected: 'Connected',
            disconnected: 'Disconnected',
            noSessionCode:
              'Please go back to the main page and enter a session code',
            connectionError:
              'Unable to connect to session. Please try again later.',
            enterName: 'Please enter your name',
            noConnection: 'No connection to session',
            waitingConnection: 'Waiting for connection, please try again later',
            joinError: 'Unable to join session. Please try again later.',
            joinSession: 'Join Session',
            enterNameToStart: 'Enter your name to start',
            displayName: 'Display Name',
            enterYourName: 'Enter your name',
            avatar: 'Avatar',
            changeAvatar: 'Change Avatar',
            joinNow: 'Join Now',
            waitingRoom: 'Waiting Room',
            waitingForHost: 'Waiting for host to start session',
            sessionStartingSoon: 'Session will start soon...',
            participants: 'Participants',
            noOtherParticipants: 'No other participants yet',
            leaveSession: 'Leave Session',
          },

          // Host Session Page
          hostSession: {
            settingUpSession: 'Setting up session',
            preparingWaitingRoom: 'PreziQ is preparing your waiting room...',
            joinAt: 'Join at:',
            pinCode: 'PIN code:',
            copy: 'Copy',
            hide: 'Hide',
            copied: 'Copied!',
            playersCountOf300: 'of 300 players:',
            joinOnThisDevice: 'Join on this device',
            preziqVersion: 'PreziQ v1.0',
            startSession: 'Start Session',
            starting: 'Starting...',
            setupRole: 'Setup Role',
            chooseParticipationMethod:
              'Choose how you want to participate in this session',
            participateInAnswers: 'Participate in answers',
            yourName: 'Your name',
            enterYourName: 'Enter your name',
            changeAvatar: 'Change avatar',
            cancel: 'Cancel',
            confirm: 'Confirm',
            processing: 'Processing...',
            websiteUrl: 'preziq.com',
          },

          // Collections Page
          collections: {
            title: 'Collections',
            searchPlaceholder: 'Search collections...',
            allTopics: 'All Topics',
            searchResults: 'Search Results',
            scrollLeft: 'Scroll left',
            scrollRight: 'Scroll right',
            tryAgain: 'Try Again',
            errorLoadingTopics:
              'Could not load topics. Please try again later.',
            errorLoadingCollections:
              'Could not load collections. Please try again later.',
            deleteSuccess: 'Collection deleted successfully.',
            deleteError: 'Unable to delete collection. Please try again later.',
            deleteErrorGeneric: 'An error occurred while deleting',
            // Join Session Banner
            joinSession: 'Join Session',
            enterPinToParticipate: 'Enter PIN code to',
            participateAndAnswer: 'participate and answer questions',
            enterPinCode: 'Enter PIN code',
            joinNow: 'Join Now',
            pleaseEnterSessionCode: 'Please enter a session code',
            createCollection: 'Create Collection',
            createYourOwn: 'Create your own',
            questionCollection: 'question collection',
            // Empty Collections
            noCollectionsFound: 'No collections found',
            tryDifferentSearch:
              'Try a different search term or clear your search to see all collections.',
            createFirstCollection:
              'Create your first collection to start building interactive learning experiences.',
          },

          // Login Page
          login: {
            welcomeBack: 'Welcome Back',
            signInToContinue:
              'Sign in to your PreziQ account to continue creating and sharing amazing presentations.',
            email: 'Email',
            phoneNumber: 'Phone Number',
            password: 'Password',
            signInWithInstead: 'Sign in with another method',
            phoneNumberPlaceholder: 'e.g., 0886332809',
            emailRequired: 'Email is required',
            phoneRequired: 'Phone number is required',
            passwordRequired: 'Password is required',
            signingIn: 'Signing in...',
            signIn: 'Sign In',
            forgotPassword: 'Forgot password?',
            dontHaveAccount: "Don't have an account?",
            signUp: 'Sign up',
            resendVerification: 'Resend verification email',
            resendVerificationTitle: 'Confirm resend email',
            resendVerificationDesc:
              'Your account is not verified. Do you want to resend verification email to {email}?',
            cancel: 'Cancel',
            resend: 'Resend',
            verificationEmailSent: 'Verification email sent!',
            resendVerificationError: 'Error sending verification!',
            pleaseTryAgain: 'Please try again.',
            youMustEnterEmailOrPhone: 'You must enter email or phone number!',
          },

          // Profile Page
          profile: {
            // Tab Names
            personalInfo: 'Personal Profile',
            email: 'Email',
            password: 'Password',

            // Personal Information Form
            personalInfoTitle: 'Personal Information',
            personalInfoDescription:
              'Manage your personal information and account security easily and safely',
            personalInfoCard: 'Personal Information',
            personalInfoCardDesc:
              'Update your name, birth date and other personal information',
            emailSettingsCard: 'Email Settings',
            emailSettingsCardDesc: 'Change email address and verify account',
            securityCard: 'Security',
            securityCardDesc: 'Change password and enhance account security',
            lastName: 'Last Name',
            firstName: 'First Name',
            nickname: 'Nickname',
            birthDate: 'Birth Date',
            gender: 'Gender',
            nationality: 'Nationality',
            avatar: 'Avatar',
            clickToChange: 'Click to change',
            memberSince: 'Member since',
            cropAvatar: 'Crop Avatar',
            zoom: 'Zoom',
            cancel: 'Cancel',
            cropAndUpload: 'Crop and upload',
            processing: 'Processing...',
            updateInfo: 'Update info',
            updating: 'Updating...',
            lastNamePlaceholder: 'Last Name',
            firstNamePlaceholder: 'First Name',
            nicknamePlaceholder: 'Enter nickname (optional)',
            selectGender: 'Select gender',
            selectNationality: 'Select nationality',
            loading: 'Loading...',
            male: 'Male',
            female: 'Female',
            other: 'Other',

            // Email Form
            updateEmail: 'Update email',
            updateEmailTitle: 'Update Email',
            updateEmailDescription:
              'Change your email address. You will need to confirm the new email.',
            currentEmail: 'Current email',
            newEmail: 'New email',
            newEmailPlaceholder: 'Enter your new email',
            sendRequest: 'Send request',
            sending: 'Sending...',
            checkYourEmail: 'Check your email',
            emailMustBeDifferent:
              'New email must be different from current email',
            cannotUpdateEmail: 'Cannot update email. Please try again later.',

            // Password Form
            passwordTitle: 'Password',
            passwordDescription: 'Update your password to protect your account',
            currentPassword: 'Current password',
            newPassword: 'New password',
            confirmNewPassword: 'Confirm new password',
            currentPasswordPlaceholder: 'Enter current password',
            newPasswordPlaceholder: 'Enter new password',
            confirmPasswordPlaceholder: 'Confirm new password',
            currentPasswordRequired:
              'Current password must be at least 6 characters',
            newPasswordRequired: 'New password must be at least 8 characters',
            passwordComplexity:
              'Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character',
            confirmPasswordRequired:
              'Confirm password must be at least 8 characters',
            passwordMismatch: 'Confirm password does not match',
            updatingPassword: 'Updating...',
            updatePassword: 'Update password',
            passwordUpdateSuccess:
              'Password updated successfully. Please login again.',
            cannotUpdatePassword: 'Cannot update password. Please try again.',

            // Form Validation Messages
            firstNameRequired: 'First name is required.',
            firstNameTooLong: 'First name cannot be longer than 50 characters.',
            lastNameRequired: 'Last name is required.',
            lastNameTooLong: 'Last name cannot be longer than 50 characters.',
            nicknameTooLong: 'Nickname cannot be longer than 30 characters.',
            nationalityTooLong: 'Quốc tịch không được vượt quá 50 ký tự.',
            fileMinSize: 'File must be larger than 1KB',
            fileMaxSize: 'File cannot be larger than 5MB',
            fileType: 'Only JPG, JPEG or PNG files are allowed',
            emailRequired: 'Please enter email',
            emailInvalid: 'Email is invalid',
            currentPasswordMinLength:
              'Current password must be at least 6 characters',
            newPasswordMinLength: 'New password must be at least 8 characters',
            newPasswordPattern:
              'New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
            confirmPasswordMinLength:
              'Confirm password must be at least 8 characters',
            confirmPasswordMatch: 'Confirm password does not match',

            // Success/Error Messages
            uploadSuccess: 'Profile image uploaded successfully',
            cropUploadSuccess: 'Profile image uploaded successfully',
            updateSuccess: 'Personal information updated successfully',
            noChanges: 'No changes were made',
            newEmailMustDifferent:
              'New email must be different from current email',
            uploadError: 'Unable to upload profile image. Please try again.',
            updateError:
              'Unable to update information. Please try again later.',
            loadingError: 'Unable to load user information',
            genericError: 'An error occurred while updating',
            oldAvatarDeleteWarning:
              'Successfully updated but unable to delete old avatar.',
            fileFormatNotSupported: 'File format not supported',
            fileTooSmall: 'File too small',
            fileTooLarge: 'File too large',
            cannotCreateCroppedImage: 'Unable to create cropped image',
            fileUrlNotFound: 'File URL not found in response',
            couldNotLoadCountries: 'Unable to load countries',

            // Profile Page
            profilePageTitle: 'Personal Information',
            profilePageDescription:
              'Manage your personal information and account security easily and securely',
          },

          // Activity translations
          activity: {
            types: {
              multiple_choice: 'Single Choice',
              multiple_response: 'Multiple Choice',
              true_false: 'True/False',
              text_answer: 'Text Answer',
              reorder: 'Reorder',
              location: 'Location',
              slide: 'Information Slide',
              info_slide: 'Info Slide',
              matching_pair: 'Matching Pairs',
            },
            questionType: 'Question Type',
            answerOptions: 'Answer Options',
            slideContent: 'Slide Content',
            timeSettings: 'Time Settings',
            pointSettings: 'Point Settings',
            timeLimit: 'Time Limit',
            pointType: 'Point Type',
            pointTypes: {
              standard: 'Standard Points',
              noPoints: 'No Points',
              doublePoints: 'Double Points',
            },
            backgroundSettings: 'Background Settings',
            backgroundColor: 'Background Color',
            backgroundImage: 'Background Image',
            backgroundImagePlaceholder: 'Enter image URL',
            backgroundImageUrl: 'Background Image URL',
            pastelColors: 'Pastel Colors',
            uploadImage: 'Upload Image',
            clearBackground: 'Clear',
            addOption: 'Add Option',
            deleteOption: 'Delete Option',
            correctAnswer: 'Correct Answer',
            selectOne: 'Select One Answer',
            selectMultiple: 'Select All That Apply',
            enterCorrectAnswer: 'Enter the correct answer',
            studentsTypeExact:
              'Students must type this exact answer to be correct',
            addActivity: 'Add Activity',
            deleteActivity: 'Delete Activity',
            confirmDelete: 'Are you sure you want to delete this activity?',
            saving: 'Saving...',
            editMode: 'Edit Mode',
            preview: 'Preview',
            settings: 'Settings',
            content: 'Content',
            design: 'Design',
            metadata: 'Metadata',
            animation: 'Animation',
            title: 'Title',
            description: 'Description',
            published: 'Published',
            visible: 'Visible',
            draft: 'Draft',
            enterTitle: 'Enter activity title',
            enterDescription: 'Enter a brief description',
            locationPoints: 'Location Points',
            addPoint: 'Add Point',
            latitude: 'Latitude',
            longitude: 'Longitude',
            radius: 'Radius (km)',
            hint: 'Hint',
            noLocationPoints: 'No location points set',
            uploading: 'Uploading...',
            invalidImageUrl: 'Invalid Image URL',
            maxFileSize: 'Supports PNG, JPG (max 5MB, min 1KB)',
            advancedSettings: 'Advanced Settings',
            moreSettings: 'More Settings',
            enterOptionTextPlaceholder: 'Enter option text',
            enterHintPlaceholder: 'Enter a hint for this question',
            option: 'Option',
            delete: 'Delete', // Reorder options
            addStep: 'Add Step',
            addFirstStep: 'Add First Step',
            noStepsAdded: 'No steps added yet',
            step: 'Step',
            arrangeSteps: 'Arrange Steps',
            defineStepsDescription:
              'Define steps in the correct order. Students will need to arrange these steps in the same sequence.',
            // Text answer form
            enterCorrectAnswerPlaceholder: 'Enter the correct answer',
            clickToAddCorrectAnswer: 'Click to add correct answer',
            saveAnswer: 'Save Answer',
            cancel: 'Cancel',
            studentsTypeExactTooltip:
              'Students must type this exact answer to be marked as correct. The answer is case-sensitive.',
            studentsTypeExactNote:
              'Students must type this exact answer to be marked correct',
            textAnswerHelpText:
              'Click on the answer to edit it when in edit mode',
            textAnswerHelpTextEditMode:
              'Click outside or press Enter to save your changes',
            reorderHelpText: 'Steps in order - Enable edit mode to reorder',
            reorderHelpTextEditMode:
              'Drag and drop to arrange steps (edit mode enabled)',
            hintReorder: 'Drag the handle to move',
            instructions: 'Instructions',
            reorderHelpText2:
              'Enable edit mode to drag and drop for reordering',
            reorderHelpTextEditMode2: 'Keep to icon',
            autoSaveOrder: 'Order will be saved automatically upon release',
            toDrag: 'to drag',
            image: 'Image',
            upload: 'Upload',
            moduleCollection: 'Module Collection',
            slide: {
              colorTab: 'Color',
              imageTab: 'Image',
              customColorLabel: 'Custom Color',
              colorPresetsLabel: 'Color Presets',
              uploadImageLabel: 'Upload Image',
              dragAndDropUpload: 'Drag and drop or click to upload',
              selectFromComputer: 'Select from computer',
              removeBackgroundImage: 'Remove Background Image',
              animationTimeline: 'Animation Timeline',
              elementsCount: 'elements',
              noElementsYet: 'No elements yet',
              noElementsDescription:
                'Add elements to your slide to see them appear here. You can then drag to reorder and adjust animation timing.',
              dragDropTips: 'Drag & Drop Tips:',
              dragVertically: 'Drag vertically to reorder elements',
              dragHorizontally: 'Drag horizontally to change hierarchy levels',
              sameLevelAnimation:
                'Elements with the same level will animate together',
              animation: 'Animation',
              chooseEffect: 'Choose effect for element',
              noAnimation: 'No Animation',
              durationTooltip: 'Duration: {duration}s',
              delayTooltip: 'Delay: {delay}s',
              slideAnimation: 'Animation',
              selectAnimation: 'Select animation for element',
              selectedAnimation: 'Selected: {animationName}',
              animationDuration: 'Animation Duration',
              animationDelay: 'Animation Delay',
              // Từ animationOptions
              noAnimationDescription: 'No effect',
              fade: 'Fade',
              fadeDescription: 'Fade effect',
              slideLeft: 'Slide Left',
              slideLeftDescription: 'Slide from left',
              slideRight: 'Slide Right',
              slideRightDescription: 'Slide from right',
              rotateIn: 'Rotate In',
              rotateInDescription: 'Rotate in',
              bounce: 'Bounce',
              bounceDescription: 'Bounce effect',
            },
          },

          // View Collection Page
          'viewCollection.loading': 'Loading...',
          'viewCollection.error': 'Error',
          'viewCollection.oopsError': 'Oops! An error occurred',
          'viewCollection.collectionNotFound': 'Collection not found',
          'viewCollection.goBack': 'Go back',
          'viewCollection.startLearning': 'Start Learning',
          'viewCollection.share': 'Share',
          'viewCollection.save': 'Save',
          'viewCollection.saved': 'Saved',
          'viewCollection.like': 'Like',
          'viewCollection.copy': 'Copy',
          'viewCollection.copying': 'Copying...',
          'viewCollection.activities': 'Activities',
          'viewCollection.questions': 'Questions',
          'viewCollection.time': 'Time',
          'viewCollection.difficulty': 'Difficulty',
          'viewCollection.information': 'Information',
          'viewCollection.createdAt': 'Created at:',
          'viewCollection.author': 'Author:',
          'viewCollection.students': 'Students: {count} people learning',
          'viewCollection.contentTypes': 'Content Types',
          'viewCollection.progress': 'Progress',
          'viewCollection.completed': 'Completed',
          'viewCollection.preview': 'Preview',
          'viewCollection.list': 'List',
          'viewCollection.grid': 'Grid',
          'viewCollection.searchActivities': 'Search activities...',
          'viewCollection.all': 'All',
          'viewCollection.noContent': 'No content yet',
          'viewCollection.noContentDescription':
            'This collection has no activities yet. Please come back when more content is added.',
          'viewCollection.activity': 'Activity {number}',
          'viewCollection.copySuccess': 'Copy successful!',
          'viewCollection.copySuccessDescription':
            'Collection "{title}" has been copied.',
          'viewCollection.copyError': 'Copy error',
          'viewCollection.copyErrorDescription':
            'Unable to copy collection. Please try again.',
          'viewCollection.shareSuccess': 'Copied to clipboard',
          'viewCollection.shareSuccessDescription':
            'Link has been copied to clipboard',
          'viewCollection.bookmarkAdded': 'Bookmarked',
          'viewCollection.bookmarkAddedDescription': 'Added to favorites list',
          'viewCollection.bookmarkRemoved': 'Bookmark removed',
          'viewCollection.bookmarkRemovedDescription':
            'Removed from favorites list',
          'viewCollection.liked': 'Liked',
          'viewCollection.likedDescription': 'Liked collection',
          'viewCollection.unliked': 'Unliked',
          'viewCollection.unlikedDescription': 'Unliked collection',

          // Question Viewer
          'questionViewer.noActivities': 'No activities',
          'questionViewer.noActivitiesDescription':
            'This collection has no activities added yet.',
          'questionViewer.showList': 'Show list',
          'questionViewer.hideList': 'Hide list',
          'questionViewer.showAnswers': 'Show answers',
          'questionViewer.sound': 'Sound',
          'questionViewer.viewMode': 'View mode',
          'questionViewer.mobile': 'Mobile',
          'questionViewer.tablet': 'Tablet',
          'questionViewer.desktop': 'Desktop',
          'questionViewer.fullscreen': 'Fullscreen',
          'questionViewer.fullscreenShortcut': '(F)',
          'questionViewer.activities': 'activities',
          'questionViewer.currentlyViewing': 'Currently viewing',
          'questionViewer.questionList': 'Question list',
          'questionViewer.mapLoadingError':
            'Cannot load map. Please check internet connection.',
          'questionViewer.mapInitError': 'Map initialization error',
          'questionViewer.loadingMap': 'Loading map...',
          'questionViewer.legend': 'Legend:',
          'questionViewer.exactLocation': 'Exact location',
          'questionViewer.acceptableArea': 'Acceptable area (radius)',
          'questionViewer.pointsToFind': '{count} points to find',
          'questionViewer.correctLocation': 'Location',
          'questionViewer.latitude': 'Latitude:',
          'questionViewer.longitude': 'Longitude:',
          'questionViewer.radius': 'Radius:',
          'questionViewer.point': 'Point {number}',
          'questionViewer.noMatchingPairsData': 'No matching pairs data',
          'questionViewer.typeAnswerHere': 'Type your answer here...',
          'questionViewer.correctAnswer': 'Correct answer:',
          'questionViewer.notSpecified': 'Not specified',
          'questionViewer.readOnlyPreview':
            'This is a read-only preview of the text answer question',
          'questionViewer.reorderSteps':
            'Order of steps - Enable edit mode to rearrange',
          'questionViewer.dragHint': 'Drag handle to move',
          'questionViewer.step': 'Step',
          'questionViewer.infoSlide': 'Info Slide',
          'questionViewer.slide': 'Slide',
          'questionViewer.activity': 'Activity {number}',

          // Common
          'common.unknownDate': 'Unknown date',
          'common.invalidDate': 'Invalid date',
        },
      },
      vi: {
        translation: {
          // Navigation
          features: 'Tính năng',
          useCase: 'Trường hợp sử dụng',
          pricing: 'Bảng giá',
          achievements: 'Thành tựu',
          testimonials: 'Đánh giá',
          faq: 'Câu hỏi thường gặp',
          blog: 'Blog',
          signIn: 'Đăng nhập',
          signUp: 'Đăng ký miễn phí',

          // Features submenu
          aiPresentationBuilder: 'Công cụ tạo bài thuyết trình AI',
          designTemplates: 'Mẫu thiết kế',
          realtimeCollaboration: 'Cộng tác thời gian thực',

          // Use Cases submenu
          marketingTeams: 'Đội ngũ tiếp thị',
          salesProfessionals: 'Chuyên viên bán hàng',
          education: 'Giáo dục',

          // Hero Section
          heroTitle: 'Thuyết trình như một',
          presentationTitle: 'Chuyên gia',
          heroSubtitle:
            'Nâng tầm thuyết trình với nền tảng tương tác, game hóa thời gian thực của PreziQ!',
          getStarted: 'Bắt đầu ngay',
          learnMore: 'Tìm hiểu thêm',

          // Features Section
          featuresTitle: 'Tính năng mạnh mẽ',
          featureOneTitle: 'Thu hút khán giả với Slides tương tác',
          featureOneDesc:
            'Tạo bài thuyết trình năng động thu hút khán giả với các yếu tố tương tác, bình chọn và phản hồi thời gian thực.',
          featureTwoTitle: 'Học tập dựa trên trò chơi thật đơn giản',
          featureTwoDesc:
            'Biến bất kỳ bài thuyết trình nào thành trò chơi câu đố hấp dẫn tương tự như Kahoot, với bảng xếp hạng và thi đấu đồng đội.',
          featureThreeTitle:
            'Nâng cao bài thuyết trình của bạn với công cụ học tập trò chơi của PreziQ',
          featureThreeDesc:
            'Tham gia cùng hàng ngàn giáo viên và người thuyết trình đã cải thiện nội dung của họ bằng nền tảng thuyết trình tương tác và học tập dựa trên trò chơi của chúng tôi.',

          // Testimonials Section
          testimonialsTitle: 'Người dùng nói gì về chúng tôi',
          testimonialDesc: 'Hàng ngàn đội nhóm và cá nhân tin tưởng PreziQ',
          testimonialAuthor1: 'Quách Phú Thuận',
          testimonialRole1: 'Giám đốc Marketing',
          testimonialText1:
            'PreziQ đã cải thiện hoàn toàn bài thuyết trình marketing của chúng tôi. Các tính năng AI tiết kiệm rất nhiều thời gian và các yếu tố tương tác giúp khán giả tập trung hơn.',
          testimonialAuthor2: 'Lê Phạm Thanh Duy',
          testimonialRole2: 'Giáo sư Đại học',
          testimonialText2:
            'The game-based learning features have completely changed how I teach. My students are more engaged and retain information better.',
          testimonialAuthor3: 'Lê Trần Hoàng Kiên',
          testimonialRole3: 'Giám đốc Bán hàng',
          testimonialText3:
            'Tỷ lệ chuyển đổi của chúng tôi đã tăng 40% kể từ khi bắt đầu sử dụng PreziQ cho các bài thuyết trình bán hàng. Các tính năng tương tác tạo nên sự khác biệt.',

          // Text Marquee Section
          trustedBy: 'Được tin dùng bởi các công ty đổi mới trên toàn thế giới',
          marqueeTextFirst: 'Tạo bài thuyết trình ấn tượng với PreziQ',
          marqueeTextSecond:
            'Thu hút khán giả của bạn • Truyền tải thông điệp • Nổi bật',

          // Newsletter Section
          newsletterTitle: 'Cập nhật thông tin về thuyết trình',
          newsletterDesc:
            'Nhận cập nhật về xu hướng thiết kế bài thuyết trình, mẹo nói trước công chúng, mẫu độc quyền và lời khuyên chuyên gia để nâng cao bài thuyết trình của bạn.',
          emailPlaceholder: 'Nhập email của bạn',
          subscribe: 'Đăng ký',
          privacyStatement:
            'Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.',
          newsletterImageAlt: 'Kết nối với bản tin PreziQ',
          over: 'Hơn',
          presentationPros: 'chuyên gia thuyết trình',
          alreadySubscribed: 'đã đăng ký.',
          and: 'và',

          // Demo UI Section
          demoTitle: 'Chuyển đổi bài thuyết trình của bạn',
          demoSubtitle:
            'Xem thử cách tạo bài thuyết trình tương tác dễ dàng như thế nào',
          demoButton: 'Xem Demo',
          demoImageAlt: 'Demo thuyết trình PreziQ',

          // Quiz Demo Section
          quizTypes: 'Thư viện Quiz Tương tác',
          'quiz.exploreTitle': 'Khám phá ',
          'quiz.quizFormats': 'Các Định Dạng Quiz',
          'quiz.mainDescription':
            'Từ trắc nghiệm đến câu hỏi vị trí, tạo nên trải nghiệm học tập tương tác phong phú với PreziQ',
          'quiz.demo': 'Demo',
          'quiz.typeAnswer': 'Nhập câu trả lời của bạn...',
          'quiz.correctAnswer': 'Đáp án đúng:',
          'quiz.dragToReorder': 'Kéo để sắp xếp lại các mục',
          'quiz.interactiveMap': 'Bản đồ tương tác',
          'quiz.clickToIdentify': 'Nhấp để xác định:',
          'quiz.countries': 'Quốc gia',
          'quiz.capitals': 'Thủ đô',
          'quiz.dragToConnect': 'Kéo để kết nối',
          'quiz.educationalContent': 'Nội dung giáo dục',
          'quiz.webDevContent':
            'Phát triển web là quá trình xây dựng trang web và ứng dụng web...',
          'quiz.question.multiple-choice': 'Thủ đô của Pháp là gì?',
          'quiz.question.multiple-response':
            'Những ngôn ngữ lập trình nào sau đây?',
          'quiz.question.true-false':
            'Trái Đất là hành tinh thứ ba tính từ Mặt Trời.',
          'quiz.question.type-answer': '15 + 27 bằng bao nhiêu?',
          'quiz.question.reorder': 'Sắp xếp các sự kiện theo thứ tự thời gian:',
          'quiz.question.location': 'Tháp Eiffel nằm ở đâu?',
          'quiz.question.matching-pairs':
            'Ghép các quốc gia với thủ đô của chúng:',
          'quiz.question.info-slide': 'Giới thiệu về Phát triển Web',
          'quiz.title.multiple-choice': 'Quiz Trắc nghiệm',
          'quiz.title.multiple-response': 'Quiz Đa lựa chọn',
          'quiz.title.true-false': 'Quiz Đúng/Sai',
          'quiz.title.type-answer': 'Quiz Nhập câu trả lời',
          'quiz.title.reorder': 'Quiz Sắp xếp',
          'quiz.title.location': 'Quiz Vị trí',
          'quiz.title.matching-pairs': 'Quiz Ghép cặp',
          'quiz.title.info-slide': 'Slide thông tin',
          'quiz.description.multiple-choice':
            'Học sinh chọn một đáp án đúng từ nhiều lựa chọn',
          'quiz.description.multiple-response':
            'Học sinh có thể chọn nhiều đáp án đúng',
          'quiz.description.true-false': 'Câu hỏi lựa chọn nhị phân đơn giản',
          'quiz.description.type-answer':
            'Học sinh nhập câu trả lời vào trường văn bản',
          'quiz.description.reorder':
            'Học sinh sắp xếp các mục theo thứ tự đúng',
          'quiz.description.location':
            'Học sinh xác định vị trí trên bản đồ tương tác',
          'quiz.description.matching-pairs':
            'Học sinh kết nối các mục liên quan từ hai cột',
          'quiz.description.info-slide':
            'Trình bày thông tin mà không cần tương tác quiz',
          'quiz.type.quiz_buttons': 'Trắc nghiệm',
          'quiz.type.quiz_checkboxes': 'Đa lựa chọn',
          'quiz.type.quiz_true_or_false': 'Đúng sai',
          'quiz.type.quiz_type_answer': 'Nhập đáp án',
          'quiz.type.quiz_reorder': 'Sắp xếp',
          'quiz.type.quiz_location': 'Vị trí',
          'quiz.type.quiz_matching_pairs': 'Ghép cặp',
          'quiz.type.info_slide': 'Slide thông tin',
          'quiz.features.singleChoice': 'Chọn một đáp án đúng duy nhất',
          'quiz.features.intuitive': 'Giao diện trực quan, dễ sử dụng',
          'quiz.features.basicKnowledge':
            'Phù hợp cho kiểm tra kiến thức cơ bản',
          'quiz.features.multipleChoice': 'Chọn nhiều đáp án đúng',
          'quiz.features.comprehensive': 'Đánh giá hiểu biết toàn diện',
          'quiz.features.flexibleScoring': 'Linh hoạt trong chấm điểm',
          'quiz.features.binaryChoice': 'Lựa chọn nhị phân đơn giản',
          'quiz.features.quickAssessment': 'Công cụ đánh giá nhanh',
          'quiz.features.easyParticipation': 'Tham gia dễ dàng cho học sinh',
          'quiz.features.textInput': 'Nhập văn bản tự do',
          'quiz.features.openAnswers': 'Câu trả lời mở',
          'quiz.features.flexibleResponse': 'Định dạng phản hồi linh hoạt',
          'quiz.features.dragDrop': 'Giao diện kéo thả',
          'quiz.features.sequentialLearning': 'Hỗ trợ học tập tuần tự',
          'quiz.features.orderConcepts': 'Sắp xếp khái niệm logic',
          'quiz.features.interactiveMap': 'Tương tác với bản đồ thực tế',
          'quiz.features.geographyLearning': 'Học địa lý một cách sinh động',
          'quiz.features.multipleMarkers': 'Hỗ trợ nhiều điểm đánh dấu',
          'quiz.features.connectItems': 'Kết nối các mục liên quan',
          'quiz.features.associativeLearning': 'Học tập qua kết hợp',
          'quiz.features.bidirectionalInteraction': 'Tương tác hai chiều',
          'quiz.features.clearPresentation': 'Trình bày thông tin rõ ràng',
          'quiz.features.educationalSupport': 'Hỗ trợ nội dung giáo dục',
          'quiz.features.noInteractionNeeded': 'Không cần tương tác',
          'quiz.tryNow.multiple-choice': 'Thử ngay Trắc nghiệm',
          'quiz.tryNow.multiple-response': 'Thử ngay Đa lựa chọn',
          'quiz.tryNow.true-false': 'Thử ngay Đúng/Sai',
          'quiz.tryNow.type-answer': 'Thử ngay Nhập câu trả lời',
          'quiz.tryNow.reorder': 'Thử ngay Sắp xếp',
          'quiz.tryNow.location': 'Thử ngay Vị trí',
          'quiz.tryNow.matching-pairs': 'Thử ngay Ghép cặp',
          'quiz.tryNow.info-slide': 'Thử ngay Slide thông tin',
          'quiz.readyToCreate': 'Sẵn sàng tạo Quiz của bạn?',
          'quiz.ctaDescription':
            'Bắt đầu tạo những bài quiz tương tác hấp dẫn với PreziQ ngay hôm nay',
          'quiz.startCreating': 'Bắt đầu tạo Quiz',

          // FAQ Section
          faqTitle: 'Câu hỏi thường gặp',
          faqDesc: 'Tìm câu trả lời cho các câu hỏi phổ biến',
          faq1Question:
            'Công cụ tạo bài thuyết trình AI hoạt động như thế nào?',
          faq1Answer:
            'AI của chúng tôi phân tích nội dung của bạn và tự động tạo các slide chuyên nghiệp với bố cục, đồ họa và hiệu ứng chuyển tiếp phù hợp dựa trên đầu vào văn bản của bạn.',
          faq2Question:
            'Tôi có thể cộng tác với nhóm của mình theo thời gian thực không?',
          faq2Answer:
            'Có! Nhiều thành viên trong nhóm có thể làm việc trên cùng một bài thuyết trình cùng một lúc với tất cả các thay đổi được đồng bộ hóa theo thời gian thực.',
          faq3Question:
            'Các tính năng trò chơi tương tác hoạt động như thế nào?',
          faq3Answer:
            'Bạn có thể chuyển đổi bất kỳ bài thuyết trình nào thành bài kiểm tra hoặc trò chơi tương tác. Người tham gia tham gia bằng thiết bị di động và cạnh tranh theo thời gian thực.',
          faq4Question: 'Có gói miễn phí không?',
          faq4Answer:
            'Có, chúng tôi cung cấp gói miễn phí với các tính năng cơ bản. Các gói cao cấp mở khóa khả năng AI nâng cao và các yếu tố tương tác.',
          faq5Question:
            'Tôi có thể nhập các bài thuyết trình PowerPoint hiện có không?',
          faq5Answer:
            'Tất nhiên! Bạn có thể nhập tệp PowerPoint và nâng cao chúng với các tính năng tương tác và cải tiến AI của PreziQ.',
          viewAllFaqs: 'Xem tất cả các câu hỏi thường gặp',
          stillHaveQuestions: 'Vẫn còn thắc mắc?',
          cantFindAnswer:
            'Không thể tìm thấy câu trả lời bạn đang tìm kiếm? Vui lòng trò chuyện với đội ngũ hỗ trợ của chúng tôi.',
          chatWithSupport: 'Trò chuyện với hỗ trợ',

          // Footer
          footerTitle: 'PreziQ',
          footerDesc: 'Nền tảng thuyết trình được hỗ trợ bởi AI',
          company: 'Công ty',
          about: 'Giới thiệu',
          careers: 'Tuyển dụng',
          contact: 'Liên hệ',
          legal: 'Pháp lý',
          privacy: 'Chính sách bảo mật',
          terms: 'Điều khoản sử dụng',
          copyright: '© 2023 PreziQ. Đã đăng ký bản quyền.',
          footerNavigation: 'Điều hướng',
          footerConnect: 'Kết nối',
          footerVision: 'Tầm nhìn của chúng tôi',
          footerVisionDesc:
            'Tiên phong trong thế hệ trải nghiệm web tiếp theo thông qua mã sáng tạo và thiết kế tiên tiến.',
          footerHome: 'Trang chủ',
          footerAbout: 'Giới thiệu',
          footerServices: 'Dịch vụ',
          footerProjects: 'Dự án',
          footerBlog: 'Blog',
          footerContact: 'Liên hệ',
          footerlinkedin: 'LinkedIn',
          footertwitter: 'Twitter',
          footerinstagram: 'Instagram',
          footergithub: 'GitHub',

          // User Auth
          email: 'Email',
          password: 'Mật khẩu',
          firstName: 'Tên',
          lastName: 'Họ',
          phoneNumber: 'Số điện thoại',
          forgotPassword: 'Quên mật khẩu?',
          dontHaveAccount: 'Chưa có tài khoản?',
          alreadyHaveAccount: 'Đã có tài khoản?',
          createAccount: 'Tạo tài khoản',
          name: 'Tên',
          confirmPassword: 'Xác nhận mật khẩu',

          // Language Switcher
          selectLanguage: 'Chọn ngôn ngữ',
          changeLanguage: 'Thay đổi ngôn ngữ',

          // Navigation Compact Mode
          showMenu: 'Hiện menu',
          hideMenu: 'Ẩn menu',

          // Common
          loading: 'Đang tải...',
          save: 'Lưu',
          cancel: 'Hủy',
          delete: 'Xóa',
          edit: 'Chỉnh sửa',
          back: 'Quay lại',
          next: 'Tiếp theo',
          submit: 'Gửi',
          search: 'Tìm kiếm bài thuyết trình...',
          filterBy: 'Lọc theo',
          sortBy: 'Sắp xếp theo',

          // Dashboard translations
          user: 'Người dùng',
          companyABC: 'Công ty ABC',
          enterprise: 'Doanh nghiệp',
          startupXYZ: 'Startup XYZ',
          startup: 'Khởi nghiệp',
          general: 'Chung',
          dashboard: 'Bảng điều khiển',
          chat: 'Trò chuyện',
          administration: 'Quản trị',
          roles: 'Vai trò',
          permissions: 'Quyền hạn',
          users: 'Người dùng',
          achievement: 'Thành tựu',

          // Dashboard Overview
          totalRevenue: 'Tổng doanh thu',
          subscriptions: 'Đăng ký',
          sales: 'Bán hàng',
          activeNow: 'Đang hoạt động',
          overview: 'Tổng quan',
          recentSales: 'Bán hàng gần đây',
          salesThisMonth: 'Bạn đã bán được 265 đơn hàng trong tháng này.',
          fromLastMonth: 'so với tháng trước',
          sinceLastHour: 'kể từ giờ trước',

          // Role Management
          roleManagement: 'Quản lý vai trò',
          roleManagementDesc:
            'Quản lý vai trò và quyền hạn người dùng tại đây.',
          roleStatus: {
            title: 'Trạng thái',
            active: 'Hoạt động',
            inactive: 'Không hoạt động',
          },
          searchPlaceholder: 'Tìm kiếm vai trò...',
          reset: 'Đặt lại',

          // User Management
          userType: {
            superadmin: 'Quản trị viên cấp cao',
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            cashier: 'Thu ngân',
          },
          userStatus: {
            active: 'Hoạt động',
            inactive: 'Không hoạt động',
            invited: 'Đã mời',
            suspended: 'Tạm ngưng',
          },

          // Common Actions
          download: 'Tải xuống',
          select: 'Chọn',
          continue: 'Tiếp tục',
          apply: 'Áp dụng',
          clear: 'Xóa',
          filterPlaceholder: 'Lọc...',
          sortPlaceholder: 'Sắp xếp theo...',
          selectPlaceholder: 'Chọn...',
          datePlaceholder: 'Chọn ngày...',
          timePlaceholder: 'Chọn giờ...',
          noOptions: 'Không có tùy chọn',
          loadingOptions: 'Đang tải tùy chọn...',
          errorLoadingOptions: 'Lỗi khi tải tùy chọn',
          retryLoading: 'Thử lại',
          noData: 'Không có dữ liệu',
          loadingMore: 'Đang tải thêm...',
          loadMore: 'Tải thêm',
          endOfList: 'Kết thúc danh sách',
          noMoreData: 'Không còn dữ liệu',
          errorLoadingMore: 'Lỗi khi tải thêm dữ liệu',
          retryLoadingMore: 'Thử lại',
          noResultsFound: 'Không tìm thấy kết quả',
          tryDifferentKeywords: 'Thử từ khóa khác',
          clearFilters: 'Xóa bộ lọc',
          applyFilters: 'Áp dụng bộ lọc',
          resetFilters: 'Đặt lại bộ lọc',
          selectAllFilters: 'Chọn tất cả bộ lọc',
          deselectAllFilters: 'Bỏ chọn tất cả bộ lọc',
          selectedFilters: 'Bộ lọc đã chọn',
          clearSelection: 'Xóa lựa chọn',
          selectAllItems: 'Chọn tất cả mục',
          deselectAllItems: 'Bỏ chọn tất cả mục',
          selectedItems: 'Mục đã chọn',
          applyToSelected: 'Áp dụng cho mục đã chọn',
          cancelSelection: 'Hủy lựa chọn',
          confirmSelection: 'Xác nhận lựa chọn',
          selectAtLeastOne: 'Vui lòng chọn ít nhất một mục',
          selectAtMostOne: 'Vui lòng chọn tối đa một mục',
          selectExactlyOne: 'Vui lòng chọn chính xác một mục',
          selectBetween: 'Vui lòng chọn từ {min} đến {max} mục',
          selectMin: 'Vui lòng chọn ít nhất {min} mục',
          selectMax: 'Vui lòng chọn tối đa {max} mục',
          selectExact: 'Vui lòng chọn chính xác {count} mục',
          selectRange: 'Vui lòng chọn mục từ {start} đến {end}',
          selectAll: 'Chọn tất cả',
          deselectAll: 'Bỏ chọn tất cả',
          invertSelection: 'Đảo ngược lựa chọn',
          selectNone: 'Không chọn',
          selectSome: 'Chọn một số',
          selectMany: 'Chọn nhiều',
          selectFew: 'Chọn ít',
          selectOne: 'Chọn một',
          selectTwo: 'Chọn hai',
          selectThree: 'Chọn ba',
          selectFour: 'Chọn bốn',
          selectFive: 'Chọn năm',
          selectSix: 'Chọn sáu',
          selectSeven: 'Chọn bảy',
          selectEight: 'Chọn tám',
          selectNine: 'Chọn chín',
          selectTen: 'Chọn mười',

          // User Menu
          upgradeToPro: 'Nâng cấp lên Pro',
          account: 'Tài khoản',
          payment: 'Thanh toán',
          notifications: 'Thông báo',
          logout: 'Đăng xuất',

          // Forgot Password
          forgotPasswordTitle: 'Quên mật khẩu',
          forgotPasswordDescription:
            'Nhập email của bạn để nhận liên kết đặt lại mật khẩu.',
          sendResetLink: 'Gửi liên kết đặt lại',
          sending: 'Đang gửi...',
          forgotPasswordFailed: 'Quên mật khẩu thất bại',
          forgotPasswordGenericError: 'Đã xảy ra lỗi, vui lòng thử lại.',
          emailPlaceholderForgot: 'ten@example.com',

          // Register Page
          welcome: 'Chào mừng',
          joinPreziQ:
            'Tham gia PreziQ để khám phá những bài thuyết trình tuyệt vời và kết nối với những người sáng tạo cùng chí hướng.',
          firstNameRequired: 'Tên là bắt buộc',
          lastNameRequired: 'Họ là bắt buộc',
          phoneNumberRequired: 'Số điện thoại là bắt buộc',
          passwordRequired: 'Mật khẩu là bắt buộc',
          confirmPasswordRequired: 'Xác nhận mật khẩu là bắt buộc',
          byCreatingAccount: 'Bằng cách tạo tài khoản, bạn đồng ý với',
          termsAndConditions: 'điều khoản và điều kiện',
          privacyPolicy: 'chính sách bảo mật',
          createAnAccount: 'Tạo tài khoản',
          logIn: 'Đăng nhập',
          phoneNumberPlaceholder: 'ví dụ: 0886332809',
          emailRequired: 'Email là bắt buộc',

          // New achievements translations
          achievementName: 'Tên thành tựu',
          achievementDescription: 'Mô tả',
          achievementRequiredPoints: 'điểm',
          achievementCreatedAt: 'Ngày tạo',
          achievementSearchPlaceholder: 'Tìm kiếm thành tựu...',
          achievementNoResults: 'Không tìm thấy kết quả',
          achievementAdd: 'Thêm thành tựu',
          achievementEdit: 'Sửa',
          achievementDelete: 'Xóa',
          achievementRefresh: 'Làm mới',
          achievementBasicInfo: 'Thông tin cơ bản',
          achievementNamePlaceholder: 'Nhập tên thành tựu',
          achievementDescriptionPlaceholder: 'Nhập mô tả thành tựu',
          achievementRequiredPointsPlaceholder: 'Nhập số điểm yêu cầu',
          achievementIcon: 'Biểu tượng thành tựu',
          achievementUploadIcon: 'Tải lên biểu tượng',
          achievementUploading: 'Đang tải lên...',
          achievementFileFormat: 'Định dạng: JPG, JPEG, PNG, SVG (tối đa 5MB)',
          achievementEditTitle: 'Chỉnh sửa thông tin thành tựu',
          achievementAddTitle: 'Thêm thành tựu mới',
          achievementEditDesc: 'Cập nhật thông tin của thành tựu hiện tại',
          achievementAddDesc: 'Điền thông tin đầy đủ để tạo thành tựu mới',
          achievementCancel: 'Hủy',
          achievementSubmit: 'Gửi',
          achievementUpdating: 'Đang xử lý...',
          achievementConfirmDelete: 'Xác nhận xóa thành tựu',
          achievementDeleteDesc:
            'Hành động này không thể hoàn tác. Thành tựu sẽ bị xóa vĩnh viễn khỏi hệ thống.',
          achievementDeleteWarn: 'Bạn có chắc chắn muốn xóa thành tựu',
          achievementDeleteWarn2: 'Tất cả dữ liệu liên quan sẽ bị mất.',
          achievementDeleting: 'Đang xóa...',
          achievementDeleteBtn: 'Xóa thành tựu',
          achievementSelect: 'Chọn',
          achievementClearSearch: 'Xóa tìm kiếm',
          achievementClearFilter: 'Xóa bộ lọc',
          achievementPointsLt100: '< 100 điểm',
          achievementPoints100_500: '100 - 500 điểm',
          achievementPoints500_1000: '500 - 1000 điểm',
          achievementPointsGt1000: '> 1000 điểm',
          achievementLoadError: 'Không thể tải danh sách thành tựu',
          success: 'Thành công',
          achievementCreateSuccess: 'Tạo thành tựu thành công',
          achievementUpdateSuccess: 'Cập nhật thông tin thành tựu thành công',
          achievementDeleteSuccess: 'Xóa thành tựu thành công',
          error: 'Lỗi',
          achievementManagement: 'Quản lý thành tựu',
          achievementManagementDesc: 'Quản lý thành tựu người dùng tại đây.',
          permissionsManagement: 'Quản lý quyền hạn',
          permissionsManagementDesc: 'Quản lý quyền hạn hệ thống tại đây.',

          // Table related translations
          tableNoData: 'Không có dữ liệu',
          tableLoading: 'Đang tải...',
          tableError: 'Lỗi khi tải dữ liệu',
          tableRefresh: 'Làm mới',
          tableSearch: 'Tìm kiếm',
          tableFilter: 'Lọc',
          tableSort: 'Sắp xếp',
          tableView: 'Xem',
          tableColumns: 'Cột',
          tablePagination: {
            showing: 'Hiển thị',
            to: 'đến',
            of: 'trên tổng số',
            entries: 'mục',
            previous: 'Trước',
            next: 'Tiếp',
            first: 'Đầu',
            last: 'Cuối',
            rowsPerPage: 'Số hàng mỗi trang',
            page: 'Trang',
          },

          // Module related translations
          moduleName: 'Tên module',
          moduleDescription: 'Mô tả',
          moduleAdd: 'Thêm module',
          moduleEdit: 'Sửa module',
          moduleDelete: 'Xóa module',
          moduleCreateSuccess: 'Tạo module thành công',
          moduleUpdateSuccess: 'Cập nhật module thành công',
          moduleDeleteSuccess: 'Xóa module thành công',
          moduleDeleteError: 'Không thể xóa module',
          moduleLoadError: 'Không thể tải danh sách module',

          // Tree related translations
          treeDragToReorder: 'Kéo để sắp xếp lại',
          treeExpandAll: 'Mở rộng tất cả',
          treeCollapseAll: 'Thu gọn tất cả',

          // Module Management
          moduleManagement: 'Quản lý Module',
          moduleManagementDesc: 'Quản lý các module hệ thống tại đây.',
          moduleNamePlaceholder: 'Nhập tên module',
          moduleDescriptionPlaceholder: 'Nhập mô tả module',
          moduleAddTitle: 'Thêm module mới',
          moduleEditTitle: 'Chỉnh sửa module',
          moduleAddDesc: 'Điền đầy đủ thông tin để tạo module mới',
          moduleEditDesc: 'Cập nhật thông tin module hiện tại',
          moduleBasicInfo: 'Thông tin cơ bản',
          modulePermissions: 'Quyền hạn của Module',
          moduleSelectPermissions: 'Chọn quyền hạn cho module này',

          // Module Status
          moduleCreating: 'Đang tạo...',
          moduleUpdating: 'Đang cập nhật...',
          moduleDeleting: 'Đang xóa...',
          moduleConfirmDelete: 'Xác nhận xóa module',
          moduleDeleteDesc:
            'Hành động này không thể hoàn tác. Module sẽ bị xóa vĩnh viễn.',
          moduleDeleteWarn: 'Bạn có chắc chắn muốn xóa module',
          moduleDeleteWarn2: 'Tất cả quyền hạn liên quan sẽ bị mất.',

          // Icon Upload Related
          iconUpload: {
            title: 'Biểu tượng',
            preview: 'Xem trước biểu tượng',
            urlPlaceholder: 'https://example.com/icon.png',
            uploadButton: 'Tải lên biểu tượng',
            uploading: 'Đang tải lên...',
            fileInfo: 'Thông tin tệp',
            fileSize: 'KB',
            formatInfo: 'Định dạng: JPG, JPEG, PNG, SVG (max 5MB)',
            dragDrop: 'Kéo và thả biểu tượng vào đây',
            or: 'hoặc',
            browse: 'Duyệt tệp',
            remove: 'Xóa biểu tượng',
            error: {
              size: 'Kích thước tệp vượt quá giới hạn 5MB',
              format:
                'Định dạng tệp không hợp lệ. Vui lòng tải lên JPG, JPEG, PNG hoặc SVG',
              upload: 'Không thể tải lên biểu tượng',
            },
          },

          // New translations
          selectedCount: 'đã chọn',
          noPermissionsFound: 'Không tìm thấy quyền hạn phù hợp',
          httpMethod: 'Phương thức HTTP',
          apiPath: 'Đường dẫn API',
          submitting: 'Đang gửi...',
          sortAscending: 'Sắp xếp tăng dần',
          sortDescending: 'Sắp xếp giảm dần',
          hideColumn: 'Ẩn cột',
          moduleList: 'Danh sách module',
          createPermission: 'Tạo quyền hạn',
          createModule: 'Tạo module',
          otherPermissions: 'Quyền hạn khác',
          dragPermissionHere: 'Kéo quyền hạn vào đây để xóa khỏi module',
          updateModuleSuccess: 'Cập nhật module thành công',
          updateModuleError: 'Không thể cập nhật module cho quyền hạn',
          errorOccurred: 'Đã xảy ra lỗi',

          // Role Management
          openMenu: 'Mở menu',
          view: 'Xem',
          actions: 'Thao tác',
          confirmDelete: 'Xác nhận xóa',
          deleteConfirmation: 'Bạn có chắc chắn muốn xóa mục này?',
          confirm: 'Xác nhận',
          column: {
            name: 'Tên vai trò',
            description: 'Mô tả',
            permissions: 'Số lượng quyền hạn',
            status: 'Trạng thái',
            createdAt: 'Ngày tạo',
            createdBy: 'Người tạo',
            actions: 'Thao tác',
            select: 'Chọn',
            active: {
              active: 'Hoạt động',
              inactive: 'Không hoạt động',
            },
          },
          roleDeleteSuccess: 'Vai trò {{roleName}} đã được xóa thành công.',
          roleDeleteError: 'Không thể xóa vai trò. Vui lòng thử lại sau.',
          roleDeleteConfirmation:
            'Hành động này sẽ xóa vĩnh viễn vai trò "{{roleName}}" và không thể hoàn tác.',
          enterRoleNameToConfirm: 'Nhập "{{roleName}}" để xác nhận:',
          enterRoleNamePlaceholder: 'Nhập tên vai trò để xác nhận xóa',
          warning: 'Cảnh báo!',
          roleDeleteWarning:
            'Xóa vai trò này sẽ xóa tất cả quyền hạn liên quan và có thể ảnh hưởng đến người dùng được gán vai trò này.',
          roleNameRequired: 'Tên vai trò là bắt buộc',
          descriptionRequired: 'Mô tả là bắt buộc',
          permissionRequired: 'Cần ít nhất một quyền hạn',
          editRole: 'Chỉnh sửa vai trò',
          addNewRole: 'Thêm vai trò mới',
          editRoleDesc: 'Chỉnh sửa thông tin và quyền hạn của vai trò',
          addNewRoleDesc: 'Tạo vai trò mới với quyền hạn được chỉ định',
          basicInfo: 'Thông tin cơ bản',
          roleName: 'Tên vai trò',
          enterRoleName: 'Nhập tên vai trò',
          description: 'Mô tả',
          enterRoleDescription: 'Nhập mô tả vai trò',
          status: 'Trạng thái',
          role: 'Vai trò',
          active: 'Hoạt động',
          inactive: 'Không hoạt động',
          update: 'Cập nhật',
          add: 'Thêm',

          // User Management
          userManagement: {
            uploadAvatar: 'Tải lên ảnh đại diện',
            avatarFormat: 'Định dạng: JPG, JPEG, PNG (1KB - 5MB)',
            title: 'Quản lý người dùng',
            description: 'Quản lý người dùng trong hệ thống tại đây',
            addUser: 'Thêm người dùng',
            inviteUser: 'Mời người dùng',
            editUser: 'Chỉnh sửa người dùng',
            deleteUser: 'Xóa người dùng',
            basicInfo: 'Thông tin cơ bản',
            additionalInfo: 'Thông tin bổ sung',
            imageAndPermissions: 'Hình ảnh & Phân quyền',
            emailVerification: 'Xác thực email',
            verified: 'Đã xác thực',
            unverified: 'Chưa xác thực',
            userVerified: 'Người dùng đã xác thực email',
            userUnverified: 'Người dùng chưa xác thực email',
            cancel: 'Hủy',
            update: 'Cập nhật',
            add: 'Thêm',
            delete: 'Xóa',
            processing: 'Đang thực hiện...',
            confirmDelete: 'Xác nhận xóa',
            deleteConfirmation:
              'Hành động này sẽ xóa vĩnh viễn người dùng này. Vui lòng nhập email để xác nhận xóa.',
            enterEmailToConfirm: 'Nhập email để xác nhận',
            noChanges: 'Không có thông tin nào được thay đổi.',
            error: 'Lỗi',
            errorOccurred: 'Đã xảy ra lỗi',
            success: 'Thành công',
            inviteSuccess: 'Đã gửi lời mời thành công',
            inviteError: 'Không thể gửi lời mời',
            cropAvatar: 'Cắt ảnh đại diện',
            cropAvatarDesc:
              'Kéo và thả để cắt ảnh đại diện của bạn. Nhấn "Lưu" để áp dụng.',
            zoom: 'Phóng to',
            cropAndUpload: 'Cắt và tải lên',
            columns: {
              avatar: 'Ảnh đại diện',
              email: 'Email',
              firstName: 'Tên',
              lastName: 'Họ',
              isVerified: 'Trạng thái xác thực',
              roles: 'Vai trò',
              createdAt: 'Ngày tạo',
            },
            verification: {
              verified: 'Đã xác thực',
              unverified: 'Chưa xác thực',
            },
            table: {
              noResults: 'Không tìm thấy kết quả',
              error: {
                title: 'Đã xảy ra lỗi khi hiển thị dữ liệu',
                refresh: 'Vui lòng thử làm mới trang',
              },
            },
            roles: {
              admin: 'Quản trị viên',
              user: 'Người dùng',
              editor: 'Biên tập viên',
              viewer: 'Người xem',
              manager: 'Quản lý',
            },
            editUserDesc: 'Cập nhật thông tin người dùng hiện tại',
            addUserDesc: 'Điền thông tin đầy đủ để tạo người dùng mới',
            phoneNumber: 'Số điện thoại',
            phoneNumberPlaceholder: 'Nhập số điện thoại',
            lastNamePlaceholder: 'Nhập họ',
            firstNamePlaceholder: 'Nhập tên',
            nickname: 'Biệt danh',
            nicknamePlaceholder: 'Nhập biệt danh',
            birthDate: 'Ngày sinh',
            birthDatePlaceholder: 'Chọn ngày sinh',
            gender: 'Giới tính',
            genderPlaceholder: 'Chọn giới tính',
            genderOptions: {
              male: 'Nam',
              female: 'Nữ',
              other: 'Khác',
            },
            nationality: 'Quốc tịch',
            nationalityPlaceholder: 'Nhập quốc tịch',
            avatar: 'Ảnh đại diện',
            role: 'Vai trò',
            rolePlaceholder: 'Chọn vai trò',
          },

          // Data Table Faceted Filter
          searchByEmail: 'Tìm kiếm theo email...',
          verificationStatus: 'Trạng thái xác thực',
          verified: 'Đã xác thực',
          unverified: 'Chưa xác thực',
          toggleColumns: 'Chuyển đổi cột',

          // Collection Form
          collectionForm: {
            title: 'Tạo bộ sưu tập mới',
            subtitle: 'Xây dựng bộ sưu tập tuyệt vời cho người xem của bạn',
            editTitle: 'Chỉnh sửa bộ sưu tập',
            editSubtitle: 'Cập nhật thông tin cho bộ sưu tập của bạn',
            titleLabel: 'Tiêu đề',
            titlePlaceholder: 'Nhập tiêu đề bộ sưu tập',
            titleDescription: 'Giữ ngắn gọn và dễ nhớ',
            topicLabel: 'Chủ đề',
            topicPlaceholder: 'Chọn chủ đề',
            topicDescription: 'Chọn chủ đề phù hợp với nội dung của bạn',
            backgroundMusicLabel: 'Nhạc nền',
            backgroundMusicPlaceholder:
              'Enter music file name (e.g., technology.mp3)',
            backgroundMusicDescription: 'Background music during presentation',
            descriptionLabel: 'Mô tả',
            descriptionPlaceholder: 'Mô tả bộ sưu tập của bạn',
            descriptionDescription: 'Điều gì làm cho bộ sưu tập này đặc biệt?',
            publishLabel: 'Xuất bản bộ sưu tập',
            publishDescription: 'Làm cho nó hiển thị với mọi người',
            expertTips: 'Lời khuyên chuyên gia',
            tips: [
              'Chọn tiêu đề ấn tượng',
              'Viết mô tả rõ ràng và hấp dẫn',
              'Chọn chủ đề phù hợp với nội dung',
              'Sử dụng hình ảnh chất lượng cao, phù hợp',
              'Một hoạt động kiểm tra mặc định sẽ được tự động tạo khi tạo bộ sưu tập',
              'Chỉ xuất bản khi đã sẵn sàng',
            ],
            cancel: 'Hủy',
            save: 'Lưu',
            creating: 'Đang tạo...',
            update: 'Cập nhật',
            updating: 'Đang cập nhật...',
            importantNote: {
              title: 'Lưu ý quan trọng',
              content:
                'Khi tạo bộ sưu tập mới, hệ thống sẽ tự động thêm một hoạt động kiểm tra mặc định. Bạn có thể chỉnh sửa hoặc xóa hoạt động này sau khi tạo bộ sưu tập.',
              editContent:
                'Khi chỉnh sửa bộ sưu tập, các hoạt động quiz hiện có sẽ được giữ nguyên. Bạn có thể quản lý các hoạt động sau khi cập nhật bộ sưu tập.',
              requiredFields:
                'Các trường bắt buộc: Tiêu đề, Mô tả, Hình ảnh bìa, Chủ đề',
            },
            toast: {
              creating: {
                title: 'Đang tạo bộ sưu tập...',
                description:
                  'Vui lòng đợi trong khi chúng tôi tạo bộ sưu tập của bạn.',
              },
              success: {
                title: 'Đã tạo bộ sưu tập!',
                description: 'Bộ sưu tập của bạn đã được tạo thành công.',
              },
              error: {
                title: 'Lỗi khi tạo bộ sưu tập',
                description: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
              },
            },
            imageUpload: {
              label: 'Hình ảnh bìa',
              description:
                'Tải lên hình ảnh bìa cho bộ sưu tập của bạn (kích thước khuyến nghị: 1200x630px)',
              urlPlaceholder:
                'Dán URL hình ảnh (ví dụ: https://example.com/image.jpg)',
              uploadButton: 'Tải lên hình ảnh',
              uploading: 'Đang tải lên...',
              cropTitle: 'Cắt hình ảnh bìa',
              cropButton: 'Cắt và tải lên',
              cancelButton: 'Hủy',
              zoomLabel: 'Thu phóng:',
              previewText: 'Xem trước hình ảnh',
              recommendedSize: 'Khuyến nghị: 1200x630px',
              invalidFormat: 'Định dạng tệp không hợp lệ',
              invalidFormatDesc: 'Vui lòng tải lên tệp hình ảnh',
              fileTooLarge: 'Tệp quá lớn',
              fileTooLargeDesc: 'Vui lòng tải lên hình ảnh nhỏ hơn 5MB',
              fileTooSmall: 'Tệp quá nhỏ',
              fileTooSmallDesc: 'Vui lòng tải lên hình ảnh lớn hơn 1KB',
              uploadSuccess: 'Thành công',
              uploadSuccessDesc: 'Đã tải lên hình ảnh bìa thành công',
              uploadError: 'Lỗi',
              uploadErrorDesc: 'Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.',
              noFileUrl: 'Không tìm thấy URL tệp trong phản hồi',
            },
            uploadMusic: 'Tải lên nhạc',
            selectedMusic: 'Nhạc đã chọn',
          },

          // Session History
          sessionHistory: {
            title: 'Lịch sử phiên',
            subtitle:
              'Xem tất cả các phiên trước đây và đang hoạt động của bạn',
            totalSessions: 'Tổng số phiên',
            activeSessions: 'Phiên đang hoạt động',
            completedSessions: 'Phiên đã hoàn thành',
            averageDuration: 'Thời lượng trung bình',
            status: {
              active: 'Đang hoạt động',
              ended: 'Đã kết thúc',
              pending: 'Chờ xử lý',
              cancelled: 'Đã hủy',
            },
            duration: {
              ongoing: 'Đang diễn ra',
              lessThan30Seconds: '< 30 giây',
              lessThan1Minute: '< 1 phút',
              minutes: 'phút',
              hours: 'giờ',
              days: 'ngày',
              minutes_plural: 'phút',
              hours_plural: 'giờ',
              days_plural: 'ngày',
              unknown: 'Không xác định',
            },
            table: {
              status: 'Trạng thái',
              sessionCode: 'Mã phiên',
              collectionTitle: 'Tiêu đề bộ sưu tập',
              startTime: 'Thời gian bắt đầu',
              duration: 'Thời lượng',
              actions: 'Thao tác',
              details: 'Chi tiết',
            },
            noSessions: {
              title: 'Không tìm thấy phiên nào',
              description:
                'Bạn chưa có lịch sử phiên nào. Bắt đầu một phiên mới để tương tác với khán giả của bạn.',
              goToDashboard: 'Đi đến Bảng điều khiển',
            },
            error: {
              fetchFailed: 'Không thể tải lịch sử phiên. Vui lòng thử lại sau.',
              sessionNotFound: 'Không tìm thấy phiên',
              participantsFailed:
                'Không thể tải danh sách người tham gia. Vui lòng thử lại sau.',
              submissionsFailed:
                'Không thể tải câu trả lời của người tham gia. Vui lòng thử lại sau.',
            },
            detail: {
              backToHistory: 'Quay lại Lịch sử phiên',
              sessionOverview: 'Tổng quan phiên',
              duration: 'Thời lượng',
              participants: 'Người tham gia',
              host: 'Người chủ trì',
              leaderboard: 'Bảng xếp hạng',
              analytics: 'Phân tích',
              participantDetails: 'Chi tiết người tham gia',
              overallStats: 'Thống kê hiệu suất tổng thể',
              questionPerformance: 'Phân tích hiệu suất câu hỏi',
              participantPerformance: 'Phân tích hiệu suất người tham gia',
              correctAnswers: 'Câu trả lời đúng',
              incorrectAnswers: 'Câu trả lời sai',
              notAnswered: 'Chưa trả lời',
              score: 'Điểm số',
              rank: 'Xếp hạng',
              totalQuestions: 'Tổng số câu hỏi',
              answered: 'Đã trả lời',
              accuracy: 'Độ chính xác',
              avgResponseTime: 'Thời gian phản hồi trung bình',
              noParticipants: 'Không tìm thấy người tham gia',
              noSubmissions: 'Không tìm thấy bài nộp',
              selectParticipant: 'Chọn một người tham gia để xem chi tiết',
              submissionDetails: 'Chi tiết bài nộp',
              tabs: {
                leaderboard: 'Bảng xếp hạng',
                analytics: 'Phân tích',
                participants: 'Người tham gia',
              },
            },
          },

          // Session Join Page
          session: {
            connecting: 'Đang kết nối...',
            connected: 'Đã kết nối',
            disconnected: 'Mất kết nối',
            noSessionCode: 'Vui lòng quay lại trang chính và nhập mã phiên',
            connectionError:
              'Không thể kết nối tới phiên. Vui lòng thử lại sau.',
            enterName: 'Vui lòng nhập tên của bạn',
            noConnection: 'Không có kết nối tới phiên',
            waitingConnection: 'Đang chờ kết nối, vui lòng thử lại sau',
            joinError: 'Không thể tham gia phiên. Vui lòng thử lại sau.',
            joinSession: 'Tham gia phiên',
            enterNameToStart: 'Nhập tên của bạn để bắt đầu',
            displayName: 'Tên hiển thị',
            enterYourName: 'Nhập tên của bạn',
            avatar: 'Avatar',
            changeAvatar: 'Đổi avatar',
            joinNow: 'Tham gia ngay',
            waitingRoom: 'Sảnh chờ',
            waitingForHost: 'Đang chờ host bắt đầu phiên',
            sessionStartingSoon: 'Phiên sẽ bắt đầu sớm...',
            participants: 'Người tham gia',
            noOtherParticipants: 'Chưa có người tham gia nào khác',
            leaveSession: 'Rời phiên',
          },

          // Host Session Page
          hostSession: {
            settingUpSession: 'Đang thiết lập phiên',
            preparingWaitingRoom: 'PreziQ đang chuẩn bị phòng chờ của bạn...',
            joinAt: 'Tham gia tại:',
            pinCode: 'Mã PIN:',
            copy: 'Sao chép',
            hide: 'Ẩn',
            copied: 'Đã sao chép!',
            playersCountOf300: 'trên 300 người chơi:',
            joinOnThisDevice: 'Tham gia trên thiết bị này',
            preziqVersion: 'PreziQ v1.0',
            startSession: 'Bắt đầu phiên',
            starting: 'Đang khởi động...',
            setupRole: 'Thiết lập vai trò',
            chooseParticipationMethod:
              'Chọn cách bạn muốn tham gia vào phiên này',
            participateInAnswers: 'Tham gia trả lời',
            yourName: 'Tên của bạn',
            enterYourName: 'Nhập tên của bạn',
            changeAvatar: 'Đổi avatar',
            cancel: 'Hủy',
            confirm: 'Xác nhận',
            processing: 'Đang xử lý...',
            websiteUrl: 'preziq.com',
          },

          // Collections Page
          collections: {
            title: 'Bộ sưu tập',
            searchPlaceholder: 'Tìm kiếm bộ sưu tập...',
            allTopics: 'Tất cả chủ đề',
            searchResults: 'Kết quả tìm kiếm',
            scrollLeft: 'Cuộn trái',
            scrollRight: 'Cuộn phải',
            tryAgain: 'Thử lại',
            errorLoadingTopics: 'Không thể tải chủ đề. Vui lòng thử lại sau.',
            errorLoadingCollections:
              'Không thể tải bộ sưu tập. Vui lòng thử lại sau.',
            deleteSuccess: 'Đã xóa bộ sưu tập thành công.',
            deleteError: 'Không thể xóa bộ sưu tập. Vui lòng thử lại sau.',
            deleteErrorGeneric: 'Có lỗi xảy ra khi xóa',
            // Join Session Banner
            joinSession: 'Tham gia phiên',
            enterPinToParticipate: 'Nhập mã PIN để',
            participateAndAnswer: 'tham gia và trả lời câu hỏi',
            enterPinCode: 'Nhập mã PIN',
            joinNow: 'Tham gia ngay',
            pleaseEnterSessionCode: 'Vui lòng nhập mã phiên',
            createCollection: 'Tạo bộ sưu tập',
            createYourOwn: 'Tạo bộ sưu tập',
            questionCollection: 'câu hỏi của riêng bạn',
            // Empty Collections
            noCollectionsFound: 'Không tìm thấy bộ sưu tập',
            tryDifferentSearch:
              'Thử từ khóa tìm kiếm khác hoặc xóa tìm kiếm để xem tất cả bộ sưu tập.',
            createFirstCollection:
              'Tạo bộ sưu tập đầu tiên của bạn để bắt đầu xây dựng trải nghiệm học tập tương tác.',
          },

          // Login Page
          login: {
            welcomeBack: 'Chào mừng trở lại',
            signInToContinue:
              'Đăng nhập vào tài khoản PreziQ của bạn để tiếp tục tạo và chia sẻ những bài thuyết trình tuyệt vời.',
            email: 'Email',
            phoneNumber: 'Số điện thoại',
            password: 'Mật khẩu',
            signInWithInstead: 'Đăng nhập bằng phương pháp khác',
            phoneNumberPlaceholder: 'ví dụ: 0886332809',
            emailRequired: 'Email là bắt buộc',
            phoneRequired: 'Số điện thoại là bắt buộc',
            passwordRequired: 'Mật khẩu là bắt buộc',
            signingIn: 'Đang đăng nhập...',
            signIn: 'Đăng nhập',
            forgotPassword: 'Quên mật khẩu?',
            dontHaveAccount: 'Chưa có tài khoản?',
            signUp: 'Đăng ký',
            resendVerification: 'Gửi lại email xác thực',
            resendVerificationTitle: 'Xác nhận gửi lại email',
            resendVerificationDesc:
              'Tài khoản của bạn chưa được xác thực. Bạn có muốn gửi lại email xác thực đến địa chỉ {email} không?',
            cancel: 'Hủy',
            resend: 'Gửi lại',
            verificationEmailSent: 'Email xác thực đã được gửi!',
            resendVerificationError: 'Lỗi gửi lại xác thực!',
            pleaseTryAgain: 'Vui lòng thử lại.',
            youMustEnterEmailOrPhone: 'Bạn phải nhập email hoặc số điện thoại!',
          },

          // Profile Page
          profile: {
            // Tab Names
            personalInfo: 'Thông tin cá nhân',
            email: 'Email',
            password: 'Mật khẩu',

            // Personal Information Form
            personalInfoTitle: 'Thông tin cá nhân',
            personalInfoDescription:
              'Cập nhật và quản lý thông tin cá nhân của bạn',
            personalInfoCard: 'Thông tin cá nhân',
            personalInfoCardDesc: 'Cập nhật thông tin cá nhân của bạn',
            emailSettingsCard: 'Cài đặt email',
            emailSettingsCardDesc:
              'Thay đổi địa chỉ email và xác thực tài khoản',
            securityCard: 'Bảo mật',
            securityCardDesc: 'Thay đổi mật khẩu và nâng cao bảo mật tài khoản',
            lastName: 'Họ',
            firstName: 'Tên',
            nickname: 'Biệt danh',
            birthDate: 'Ngày sinh',
            gender: 'Giới tính',
            nationality: 'Quốc tịch',
            avatar: 'Ảnh đại diện',
            clickToChange: 'Nhấn vào ảnh để thay đổi',
            memberSince: 'Thành viên từ',
            cropAvatar: 'Cắt ảnh đại diện',
            zoom: 'Zoom',
            cancel: 'Hủy',
            cropAndUpload: 'Cắt và tải lên',
            processing: 'Đang xử lý...',
            updateInfo: 'Cập nhật thông tin',
            updating: 'Đang cập nhật...',
            lastNamePlaceholder: 'Nguyễn',
            firstNamePlaceholder: 'Văn A',
            nicknamePlaceholder: 'Nhập biệt danh (tùy chọn)',
            selectGender: 'Chọn giới tính',
            selectNationality: 'Chọn quốc tịch',
            loading: 'Đang tải...',
            male: 'Nam',
            female: 'Nữ',
            other: 'Khác',

            // Email Form
            updateEmail: 'Cập nhật email',
            updateEmailTitle: 'Cập nhật email',
            updateEmailDescription:
              'Thay đổi địa chỉ email của bạn. Bạn sẽ cần xác nhận email mới.',
            currentEmail: 'Email hiện tại',
            newEmail: 'Email mới',
            newEmailPlaceholder: 'Nhập email mới của bạn',
            sendRequest: 'Gửi yêu cầu',
            sending: 'Đang gửi...',
            checkYourEmail: 'Kiểm tra email của bạn',
            emailMustBeDifferent: 'Email mới phải khác với email hiện tại',
            cannotUpdateEmail:
              'Không thể cập nhật email. Vui lòng thử lại sau.',

            // Password Form
            passwordTitle: 'Mật khẩu',
            passwordDescription:
              'Cập nhật mật khẩu của bạn để bảo vệ tài khoản',
            currentPassword: 'Mật khẩu hiện tại',
            newPassword: 'Mật khẩu mới',
            confirmNewPassword: 'Xác nhận mật khẩu mới',
            currentPasswordPlaceholder: 'Nhập mật khẩu hiện tại',
            newPasswordPlaceholder: 'Nhập mật khẩu mới',
            confirmPasswordPlaceholder: 'Xác nhận mật khẩu mới',
            currentPasswordRequired:
              'Mật khẩu hiện tại phải có ít nhất 6 ký tự',
            newPasswordRequired: 'Mật khẩu mới phải có ít nhất 8 ký tự',
            passwordComplexity:
              'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
            confirmPasswordRequired:
              'Xác nhận mật khẩu phải có ít nhất 8 ký tự',
            passwordMismatch: 'Mật khẩu xác nhận không khớp',
            updatingPassword: 'Đang cập nhật...',
            updatePassword: 'Cập nhật mật khẩu',
            passwordUpdateSuccess:
              'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.',
            cannotUpdatePassword:
              'Không thể cập nhật mật khẩu. Vui lòng thử lại.',

            // Profile Page
            profilePageTitle: 'Hồ sơ cá nhân',
            profilePageDescription:
              'Quản lý thông tin cá nhân và bảo mật tài khoản của bạn một cách dễ dàng và an toàn',
          },

          // Activity translations in Vietnamese
          activity: {
            types: {
              multiple_choice: 'Một đáp án',
              multiple_response: 'Nhiều đáp án',
              true_false: 'Đúng/Sai',
              text_answer: 'Trả lời văn bản',
              reorder: 'Sắp xếp lại',
              location: 'Vị trí',
              slide: 'Slide thông tin',
              info_slide: 'Slide thông tin',
              matching_pair: 'Ghép cặp',
            },
            questionType: 'Loại câu hỏi',
            answerOptions: 'Tùy chọn trả lời',
            slideContent: 'Nội dung slide',
            timeSettings: 'Cài đặt thời gian',
            timeLimit: 'Giới hạn thời gian',
            pointSettings: 'Cài đặt điểm',
            pointType: 'Loại điểm',
            pointTypes: {
              standard: 'Điểm tiêu chuẩn',
              noPoints: 'Không có điểm',
              doublePoints: 'Điểm gấp đôi',
            },
            backgroundSettings: 'Cài đặt nền',
            backgroundColor: 'Màu nền',
            backgroundImage: 'Hình nền',
            backgroundImageUrl: 'URL hình nền',
            pastelColors: 'Màu pastel',
            uploadImage: 'Tải lên hình ảnh',
            clearBackground: 'Xóa',
            addOption: 'Thêm tùy chọn',
            deleteOption: 'Xóa tùy chọn',
            correctAnswer: 'Đáp án đúng',
            selectOne: 'Chọn một đáp án',
            selectMultiple: 'Chọn tất cả đáp án đúng',
            enterCorrectAnswer: 'Nhập đáp án đúng',
            studentsTypeExact:
              'Học sinh phải nhập chính xác đáp án này để được điểm',
            addActivity: 'Thêm hoạt động',
            deleteActivity: 'Xóa hoạt động',
            confirmDelete: 'Bạn có chắc chắn muốn xóa hoạt động này?',
            saving: 'Đang lưu...',
            editMode: 'Chế độ chỉnh sửa',
            preview: 'Xem trước',
            settings: 'Cài đặt',
            content: 'Nội dung',
            design: 'Thiết kế',
            metadata: 'Siêu dữ liệu',
            animation: 'Hoạt ảnh',
            title: 'Tiêu đề',
            description: 'Mô tả',
            published: 'Đã xuất bản',
            visible: 'Hiển thị',
            draft: 'Bản nháp',
            enterTitle: 'Nhập tiêu đề hoạt động',
            enterDescription: 'Nhập mô tả ngắn gọn',
            locationPoints: 'Điểm vị trí',
            addPoint: 'Thêm điểm',
            latitude: 'Vĩ độ',
            longitude: 'Kinh độ',
            radius: 'Bán kính (km)',
            hint: 'Gợi ý',
            noLocationPoints: 'Chưa có điểm vị trí nào',
            uploading: 'Đang tải lên...',
            invalidImageUrl: 'URL hình ảnh không hợp lệ',
            maxFileSize: 'Hỗ trợ PNG, JPG (tối đa 5MB, tối thiểu 1KB)',
            advancedSettings: 'Cài đặt nâng cao',
            moreSettings: 'Cài đặt khác',
            enterOptionTextPlaceholder: 'Nhập văn bản tùy chọn',
            enterSlideContentPlaceholder: 'Nhập nội dung slide',
            enterHintPlaceholder: 'Nhập gợi ý cho học sinh',
            option: 'Đáp án',
            delete: 'Xóa', // Reorder options
            addStep: 'Thêm bước',
            addFirstStep: 'Thêm bước đầu tiên',
            noStepsAdded: 'Chưa có bước nào được thêm',
            step: 'Bước',
            arrangeSteps: 'Sắp xếp các bước',
            defineStepsDescription:
              'Định nghĩa các bước theo đúng thứ tự. Học sinh sẽ cần sắp xếp các bước này theo cùng một trình tự.',
            // Text answer form
            enterCorrectAnswerPlaceholder: 'Nhập đáp án đúng',
            clickToAddCorrectAnswer: 'Nhấp để thêm đáp án đúng',
            saveAnswer: 'Lưu đáp án',
            cancel: 'Hủy',
            studentsTypeExactTooltip:
              'Học sinh phải nhập chính xác đáp án này để được đánh dấu đúng. Đáp án có phân biệt chữ hoa chữ thường.',
            studentsTypeExactNote:
              'Học sinh phải nhập chính xác đáp án này để được đánh dấu đúng',
            textAnswerHelpText:
              'Nhấp vào câu trả lời để chỉnh sửa khi ở chế độ chỉnh sửa',
            textAnswerHelpTextEditMode:
              'Nhấp vào bên ngoài hoặc nhấn Enter để lưu thay đổi của bạn',
            reorderHelpText:
              'Thứ tự các bước - Bật chế độ chỉnh sửa để sắp xếp lại',
            reorderHelpTextEditMode:
              'Kéo thả để sắp xếp các bước (chế độ chỉnh sửa đã bật)',
            hintReorder: 'Drag handle để di chuyển',
            instructions: 'Hướng dẫn sử dụng',
            reorderHelpText2: 'Bật chế độ chỉnh sửa để kéo thả sắp xếp lại',
            hintReorder2: 'Giữ vào biểu tượng',
            autoSaveOrder: 'Thứ tự sẽ được lưu tự động khi thả',
            toDrag: 'để kéo',
            image: 'Hình ảnh',
            upload: 'Tải lên',
            moduleCollection: 'Bộ sưu tập',
            slide: {
              dragAndDropUpload: 'Kéo và thả để tải lên',
              selectFromComputer: 'Chọn từ máy tính',
              colorTab: 'Màu sắc',
              imageTab: 'Hình ảnh',
              customColorLabel: 'Màu tùy chỉnh',
              colorPresetsLabel: 'Màu có sẵn',
              uploadImageLabel: 'Tải ảnh lên',
              removeBackgroundImage: 'Xóa ảnh nền',
              animationTimeline: 'Dòng thời gian hoạt ảnh',
              elementsCount: 'phần tử',
              noElementsYet: 'Chưa có phần tử nào',
              noElementsDescription:
                'Thêm phần tử vào slide của bạn để chúng xuất hiện tại đây. Sau đó, bạn có thể kéo để sắp xếp lại và điều chỉnh thời gian hoạt ảnh.',
              dragDropTips: 'Mẹo kéo và thả:',
              dragVertically: 'Kéo theo chiều dọc để sắp xếp lại các phần tử',
              dragHorizontally:
                'Kéo theo chiều ngang để thay đổi cấp độ phân cấp',
              sameLevelAnimation:
                'Các phần tử có cùng cấp độ sẽ hoạt ảnh cùng nhau',
              animation: 'Hoạt ảnh',
              chooseEffect: 'Chọn hiệu ứng cho phần tử',
              noAnimation: 'Không có hiệu ứng',
              durationTooltip: 'Thời lượng: {duration}s',
              delayTooltip: 'Độ trễ: {delay}s',
              //
              slideAnimation: 'Hiệu ứng',
              selectAnimation: 'Chọn hiệu ứng cho phần tử',
              selectedAnimation: 'Đã chọn: ',
              animationDuration: 'Thời gian hiệu ứng',
              animationDelay: 'Độ trễ hiệu ứng',
              // Từ animationOptions
              noAnimationDescription: 'Không có hiệu ứng',
              fade: 'Mờ dần',
              fadeDescription: 'Hiệu ứng mờ dần',
              slideLeft: 'Trượt từ trái',
              slideLeftDescription: 'Trượt từ trái',
              slideRight: 'Trượt từ phải',
              slideRightDescription: 'Trượt từ phải',
              rotateIn: 'Xoay vào',
              rotateInDescription: 'Xoay vào',
              bounce: 'Nảy',
              bounceDescription: 'Hiệu ứng nảy',
            },
          },

          // View Collection Page
          'viewCollection.loading': 'Đang tải...',
          'viewCollection.error': 'Lỗi',
          'viewCollection.oopsError': 'Oops! Có lỗi xảy ra',
          'viewCollection.collectionNotFound': 'Không tìm thấy collection',
          'viewCollection.goBack': 'Quay lại',
          'viewCollection.startLearning': 'Bắt đầu học',
          'viewCollection.share': 'Chia sẻ',
          'viewCollection.save': 'Lưu',
          'viewCollection.saved': 'Đã lưu',
          'viewCollection.like': 'Thích',
          'viewCollection.copy': 'Sao chép',
          'viewCollection.copying': 'Đang sao chép...',
          'viewCollection.activities': 'Hoạt động',
          'viewCollection.questions': 'Câu hỏi',
          'viewCollection.time': 'Thời gian',
          'viewCollection.difficulty': 'Độ khó',
          'viewCollection.information': 'Thông tin',
          'viewCollection.createdAt': 'Tạo lúc:',
          'viewCollection.author': 'Tác giả:',
          'viewCollection.students': 'Học viên: {count} người đang học',
          'viewCollection.contentTypes': 'Loại nội dung',
          'viewCollection.progress': 'Tiến độ',
          'viewCollection.completed': 'Hoàn thành',
          'viewCollection.preview': 'Preview',
          'viewCollection.list': 'Danh sách',
          'viewCollection.grid': 'Lưới',
          'viewCollection.searchActivities': 'Tìm kiếm hoạt động...',
          'viewCollection.all': 'Tất cả',
          'viewCollection.noContent': 'Chưa có nội dung',
          'viewCollection.noContentDescription':
            'Collection này chưa có hoạt động nào. Hãy quay lại sau khi có thêm nội dung.',
          'viewCollection.activity': 'Hoạt động {number}',
          'viewCollection.copySuccess': 'Sao chép thành công!',
          'viewCollection.copySuccessDescription':
            'Collection "{title}" đã được sao chép.',
          'viewCollection.copyError': 'Lỗi sao chép',
          'viewCollection.copyErrorDescription':
            'Không thể sao chép collection. Vui lòng thử lại.',
          'viewCollection.shareSuccess': 'Đã sao chép',
          'viewCollection.shareSuccessDescription':
            'Link đã được sao chép vào clipboard',
          'viewCollection.bookmarkAdded': 'Đã đánh dấu',
          'viewCollection.bookmarkAddedDescription':
            'Đã thêm vào danh sách yêu thích',
          'viewCollection.bookmarkRemoved': 'Đã bỏ đánh dấu',
          'viewCollection.bookmarkRemovedDescription':
            'Đã xóa khỏi danh sách yêu thích',
          'viewCollection.liked': 'Đã thích',
          'viewCollection.likedDescription': 'Đã thích collection',
          'viewCollection.unliked': 'Đã bỏ thích',
          'viewCollection.unlikedDescription': 'Đã bỏ thích collection',

          // Question Viewer
          'questionViewer.noActivities': 'Không có hoạt động nào',
          'questionViewer.noActivitiesDescription':
            'Collection này chưa có hoạt động nào được thêm vào.',
          'questionViewer.showList': 'Hiện danh sách',
          'questionViewer.hideList': 'Ẩn danh sách',
          'questionViewer.showAnswers': 'Hiện đáp án',
          'questionViewer.sound': 'Âm thanh',
          'questionViewer.viewMode': 'Chế độ xem',
          'questionViewer.mobile': 'Mobile',
          'questionViewer.tablet': 'Tablet',
          'questionViewer.desktop': 'Desktop',
          'questionViewer.fullscreen': 'Toàn màn hình',
          'questionViewer.fullscreenShortcut': '(F)',
          'questionViewer.activities': 'hoạt động',
          'questionViewer.currentlyViewing': 'Đang xem',
          'questionViewer.questionList': 'Danh sách câu hỏi',
          'questionViewer.mapLoadingError':
            'Không thể tải bản đồ. Vui lòng kiểm tra kết nối internet.',
          'questionViewer.mapInitError': 'Lỗi khởi tạo bản đồ',
          'questionViewer.loadingMap': 'Đang tải bản đồ...',
          'questionViewer.legend': 'Chú thích:',
          'questionViewer.exactLocation': 'Vị trí chính xác',
          'questionViewer.acceptableArea': 'Vùng chấp nhận (bán kính)',
          'questionViewer.pointsToFind': '{count} điểm cần tìm',
          'questionViewer.correctLocation': 'Location',
          'questionViewer.latitude': 'Latitude:',
          'questionViewer.longitude': 'Longitude:',
          'questionViewer.radius': 'Radius:',
          'questionViewer.point': 'Điểm {number}',
          'questionViewer.noMatchingPairsData':
            'Không có dữ liệu matching pairs',
          'questionViewer.typeAnswerHere': 'Nhập câu trả lời tại đây...',
          'questionViewer.correctAnswer': 'Đáp án đúng:',
          'questionViewer.notSpecified': 'Không được chỉ định',
          'questionViewer.readOnlyPreview':
            'Đây là bản xem trước chỉ đọc của câu hỏi nhập văn bản',
          'questionViewer.reorderSteps':
            'Thứ tự các bước - Bật chế độ chỉnh sửa để sắp xếp lại',
          'questionViewer.dragHint': 'Drag handle để di chuyển',
          'questionViewer.step': 'Bước',
          'questionViewer.infoSlide': 'Info Slide',
          'questionViewer.slide': 'Slide',
          'questionViewer.activity': 'Hoạt động {number}',

          // Common
          'common.unknownDate': 'Ngày không xác định',
          'common.invalidDate': 'Ngày không hợp lệ',
        },
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [language, setLanguageState] = useState('en'); // Default to English server-side

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);

    // Set initial language from cookie or default to English
    const currentLang = Cookies.get('i18next') || 'en';
    i18next.changeLanguage(currentLang);
    setLanguageState(currentLang);
  }, []);

  const setLanguage = (lang: string) => {
    i18next.changeLanguage(lang);
    setLanguageState(lang);
    Cookies.set('i18next', lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: (key: string, options?: { [key: string]: string }) => {
          if (!isClient) {
            // Server-side fallback
            return key.startsWith('features') ? 'Features' : key;
          }

          // Client-side with proper interpolation
          const translation = t(key, options);

          // If translation contains placeholders and we have options, manually replace them
          if (options && translation.includes('{')) {
            let result = translation;
            Object.entries(options).forEach(([placeholder, value]) => {
              result = result.replace(
                new RegExp(`{${placeholder}}`, 'g'),
                value
              );
            });
            return result;
          }

          return translation;
        },
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};