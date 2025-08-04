import { jest } from '@jest/globals'

// Mock Firebase Admin SDK
const mockFirebaseAdmin = {
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-uid-123',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
    }),
    getUser: jest.fn().mockResolvedValue({
      uid: 'test-uid-123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      customClaims: {},
    }),
    createUser: jest.fn().mockResolvedValue({
      uid: 'test-uid-123',
      email: 'test@example.com',
    }),
    updateUser: jest.fn().mockResolvedValue({
      uid: 'test-uid-123',
      email: 'test@example.com',
    }),
    setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
  }),
  firestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: jest.fn().mockReturnValue({
            subscriptionStatus: 'active',
            subscriptionPlan: 'pro',
          }),
        }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      }),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [],
        forEach: jest.fn(),
        empty: true,
        size: 0,
      }),
    }),
  }),
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn().mockReturnValue({}),
  },
}

// Mock Firebase client SDK
const mockFirebaseClient = {
  auth: {
    currentUser: {
      uid: 'test-uid-123',
      email: 'test@example.com',
      emailVerified: true,
      getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
    },
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: {
        uid: 'test-uid-123',
        email: 'test@example.com',
        getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
      },
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: {
        uid: 'test-uid-123',
        email: 'test@example.com',
        getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
      },
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn(),
  },
  initializeApp: jest.fn(),
}

jest.mock('firebase-admin', () => mockFirebaseAdmin)
jest.mock('firebase/app', () => mockFirebaseClient)
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue(mockFirebaseClient.auth),
  signInWithEmailAndPassword: mockFirebaseClient.auth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockFirebaseClient.auth.createUserWithEmailAndPassword,
  signOut: mockFirebaseClient.auth.signOut,
  onAuthStateChanged: mockFirebaseClient.auth.onAuthStateChanged,
}))

export { mockFirebaseAdmin, mockFirebaseClient }