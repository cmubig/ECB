# ECB Human Survey - Cultural Image Evaluation Platform

A Next.js application for evaluating cultural representation in AI-generated images across different models and countries.

## Features

- **Google Authentication**: Secure login with Firebase Auth
- **Country Selection**: Users select their country for relevant cultural evaluations
- **Model-Based Tabs**: Separate evaluation interface for each of 5 AI models (Flux, HiDream, NextStep, Qwen, SD3.5)
- **Cultural Assessment**: Evaluate images from user's selected country
- **Comprehensive Metrics**: Rate prompt alignment and cultural representation (1-5 scale)
- **Image Comparison**: Select best/worst images from 4 editing steps (0, 1, 3, 5)
- **Progress Tracking**: Model-specific progress tracking with resumable sessions
- **Local Dataset Integration**: Images served from local dataset directory
- **Responsive Design**: Modern UI with TailwindCSS and shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Authentication**: Firebase Auth with Google Sign-in
- **Database**: Firebase Firestore
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Google OAuth credentials configured in Firebase

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecb-human-survey
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Google provider
   - Enable Firestore database
   - Copy your Firebase config to `src/lib/firebase.ts`

4. Add your dataset:
   - Copy CSV files to `public/dataset/` directory
   - Ensure images are accessible at the paths specified in CSV files
   - CSV format: `model,country,category,sub_category,variant,T2I prompt,I2I prompt,base,edit_1,edit_2,edit_3,edit_4,edit_5`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page
│   ├── survey/            # Survey interface
│   └── progress/          # User progress page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── survey/            # Survey-specific components
│   └── ui/                # shadcn/ui components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── hooks/                 # Custom React hooks
│   └── useSurveyData.ts   # Survey data management
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── firestore.ts       # Firestore operations
│   └── data-processor.ts  # CSV parsing and validation
└── types/                 # TypeScript type definitions
    └── survey.ts          # Survey-related types
```

## Data Format

### CSV Structure
Each model should have a CSV file with the following columns:
- `model`: AI model name (flux, hidream, nextstep, qwen, sd35)
- `country`: Target country (china, india, kenya, korea, nigeria, united_states)
- `category`: Content category (architecture, art, event, fashion, food, landscape, people, wildlife)
- `sub_category`: Specific subcategory
- `variant`: Style variant (general, modern, traditional)
- `T2I prompt`: Text-to-image generation prompt
- `I2I prompt`: Image-to-image editing instruction
- `base`: Base image path
- `edit_1` to `edit_5`: Edited image paths for steps 1-5

### Survey Flow
1. Users authenticate with Google
2. System loads and shuffles survey questions from CSV data
3. For each question, users see:
   - Original prompt and editing instruction
   - 4 images (steps 0, 1, 3, 5)
   - Rating sliders for prompt alignment and cultural representation
   - Selection interface for best/worst images
4. Responses are saved to Firestore
5. Progress is tracked and resumable

## Firebase Setup

### Firestore Collections

1. **survey_responses**: Individual survey responses
   - Fields: question_id, user_id, user_email, model, country, scores, timestamps, etc.

2. **user_progress**: User completion tracking
   - Fields: user_id, completed_questions, current_question_index, total_questions

3. **survey_stats**: Global statistics (optional)
   - Fields: total_responses, responses_by_model, responses_by_country

### Security Rules
Copy the rules from `firestore.rules` to your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own progress
    match /user_progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own profile
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can create survey responses and read their own
    match /survey_responses/{responseId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow list: if request.auth != null;
    }
    
    // Public read access to global stats
    match /survey_stats/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Required Firestore Indexes
Create these composite indexes in Firebase Console:

1. **survey_responses**:
   - user_id (Ascending) + timestamp (Descending)
   - model (Ascending) + timestamp (Descending)
   - country (Ascending) + timestamp (Descending)

2. **user_progress**: No additional indexes needed
3. **user_profiles**: No additional indexes needed

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables if needed
4. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Usage Guide

### For Survey Participants

1. **Sign In**: Use your Google account to sign in
2. **Select Country**: Choose your country for relevant cultural evaluations
3. **Choose Model**: Select one of the 5 AI model tabs to evaluate
4. **Evaluate Images**: 
   - View the original prompt and editing instruction
   - Rate prompt alignment (1-5 scale)
   - Rate cultural representation (1-5 scale)
   - Select the best and worst images from the 4 steps shown
   - Add optional comments
5. **Submit**: Your progress is automatically saved
6. **Continue**: Switch between model tabs or resume later

### For Administrators

1. **Dataset Setup**: Ensure CSV files and images are properly organized in `public/dataset/`
2. **Firebase Console**: Monitor responses and user activity
3. **Analytics**: Use the progress page to view completion statistics
4. **Export Data**: Query Firestore collections for analysis

## Troubleshooting

### Common Issues

1. **Images not loading**: 
   - Check that dataset files are in `public/dataset/`
   - Verify CSV file paths match actual image locations

2. **Firebase permission errors**:
   - Ensure Firestore security rules are properly configured
   - Check that Authentication is enabled with Google provider

3. **Progress not saving**:
   - Verify user is authenticated
   - Check browser console for Firestore errors
   - Ensure proper indexes are created

### Development Tips

- Use browser dev tools to monitor network requests
- Check Firebase Console for real-time database activity
- Test with multiple user accounts to verify isolation
- Monitor Firestore usage to avoid quota limits

## Support

For questions or issues, please open a GitHub issue or contact the development team.