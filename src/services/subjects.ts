export const CATEGORIZED_SUBJECTS = {
  'Engineering College': [
    'Computer Science & Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Engineering Mathematics',
    'Engineering Physics'
  ],
  'JEE Mains & Advanced': [
    'JEE Physics',
    'JEE Chemistry',
    'JEE Mathematics'
  ],
  'CBSE & State Board (SSC)': [
    'CBSE Mathematics',
    'CBSE Science',
    'CBSE Social Science',
    'CBSE English',
    'SSC Science',
    'SSC Mathematics'
  ],
  'Entrance Exams': [
    'GATE (Graduate Aptitude Test)',
    'GRE Quantitative & Verbal',
    'TOEFL / IELTS English'
  ]
};

export const ALL_SUBJECTS = Object.values(CATEGORIZED_SUBJECTS).flat();
export const DEFAULT_SUBJECT = ALL_SUBJECTS[0];
