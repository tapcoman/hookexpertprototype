import React from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Type, 
  Mic, 
  Copy, 
  Heart,
  TrendingUp,
  Brain,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import type { HookObject } from '../../../shared/types'
import { cn, getPlatformColor, formatPlatformName } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'

interface TriModalHookResultsProps {
  hooks: HookObject[]
  platform?: string
  objective?: string
  onFavoriteToggle?: (hookIndex: number) => void
  onCopyHook?: (hook: HookObject) => void
  favoriteIds?: Set<string>
  className?: string
}

const TriModalHookResults: React.FC<TriModalHookResultsProps> = ({
  hooks,
  platform,
  objective,
  onFavoriteToggle,
  onCopyHook,
  favoriteIds = new Set(),
  className
}) => {
  const { toast } = useToast()

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: `${type} copied successfully!`,
        variant: "success"
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPsychologyColor = (driver: string) => {
    const colors = {
      'curiosity-gap': 'bg-purple-100 text-purple-800',
      'pain-point': 'bg-red-100 text-red-800',
      'value-hit': 'bg-green-100 text-green-800',
      'surprise-shock': 'bg-orange-100 text-orange-800',
      'social-proof': 'bg-blue-100 text-blue-800',
      'urgency-fomo': 'bg-yellow-100 text-yellow-800',
      'authority-credibility': 'bg-indigo-100 text-indigo-800',
      'emotional-connection': 'bg-pink-100 text-pink-800',
    }
    return colors[driver as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={cn("space-y-8", className)}>
      {hooks.map((hook, index) => {
        const scorePercentage = (hook.score / 5) * 100
        const isFavorite = favoriteIds.has(`${index}`)

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {platform && (
                        <Badge className={getPlatformColor(platform)}>
                          {formatPlatformName(platform)}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {hook.hookCategory.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPsychologyColor(hook.psychologicalDriver)}>
                        <Brain className="w-3 h-3 mr-1" />
                        {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge className={getRiskColor(hook.riskFactor)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {hook.riskFactor.toUpperCase()} Risk
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      Hook #{index + 1} - Score: {hook.score.toFixed(1)}/5.0
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFavoriteToggle?.(index)}
                      className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                {/* Quality Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Quality Score</span>
                    <span className="font-medium">{hook.score.toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={scorePercentage} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Tri-Modal Components Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Verbal Hook */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mic className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Verbal Hook</h4>
                          <p className="text-xs text-muted-foreground">{hook.wordCount} words</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(hook.verbalHook, 'Verbal hook')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm leading-relaxed">{hook.verbalHook}</p>
                    </div>
                  </div>

                  {/* Visual Hook */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Visual Hook</h4>
                          <p className="text-xs text-muted-foreground">Visual cue</p>
                        </div>
                      </div>
                      {hook.visualHook && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(hook.visualHook!, 'Visual hook')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 min-h-[80px] flex items-center">
                      {hook.visualHook ? (
                        <p className="text-sm leading-relaxed">{hook.visualHook}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No visual component for this hook
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Text Overlay */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Type className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Text Overlay</h4>
                          <p className="text-xs text-muted-foreground">On-screen text</p>
                        </div>
                      </div>
                      {hook.textualHook && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(hook.textualHook!, 'Text overlay')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 min-h-[80px] flex items-center">
                      {hook.textualHook ? (
                        <p className="text-sm leading-relaxed">{hook.textualHook}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No text overlay for this hook
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Framework and Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Framework Analysis</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Framework:</span>
                        <p className="text-sm">{hook.framework}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Strategy:</span>
                        <p className="text-sm">{hook.rationale}</p>
                      </div>
                      {hook.platformNotes && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Platform Notes:</span>
                          <p className="text-sm">{hook.platformNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Quality Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(hook.specificityScore * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Specificity</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(hook.freshnessScore * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Originality</div>
                      </div>
                    </div>
                    {hook.scoreBreakdown && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-muted-foreground">Score Breakdown:</span>
                        <p className="text-sm">{hook.scoreBreakdown}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform-Specific Content */}
                {hook.platformSpecific && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-3">Platform-Specific Elements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {hook.platformSpecific.tiktokColdOpen && (
                        <div className="p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
                          <div className="text-sm font-medium text-foreground mb-1">TikTok Cold Open</div>
                          <p className="text-sm">{hook.platformSpecific.tiktokColdOpen}</p>
                        </div>
                      )}
                      {hook.platformSpecific.instagramOverlay && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-sm font-medium text-foreground mb-1">Instagram Overlay</div>
                          <p className="text-sm">{hook.platformSpecific.instagramOverlay}</p>
                        </div>
                      )}
                      {hook.platformSpecific.youtubeProofCue && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-sm font-medium text-foreground mb-1">YouTube Proof Cue</div>
                          <p className="text-sm">{hook.platformSpecific.youtubeProofCue}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleCopy(hook.verbalHook, 'Full hook package')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => onCopyHook?.(hook)}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Content Match: {hook.promiseContentMatch ? '✓' : '⚠️'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

export default TriModalHookResults