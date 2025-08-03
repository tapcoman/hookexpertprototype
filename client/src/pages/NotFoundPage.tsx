import React from 'react'
import { Link } from 'wouter'

const NotFoundPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="btn-primary">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
EOF < /dev/null