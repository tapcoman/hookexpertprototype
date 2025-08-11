// Simple JavaScript function to test Vercel execution
module.exports = (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    
    const response = {
      message: 'Hello from Vercel!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      env: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    }
    
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      error: 'Function error',
      message: error.message
    })
  }
}