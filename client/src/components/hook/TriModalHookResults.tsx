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
import type { HookObject } from '@/types/shared'
import { cn, getPlatformColor, getPlatformGlow, getViralScoreColor, getPsychologyDriverColor, getViralRiskColor, formatPlatformName } from '../../lib/utils'
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
  objective: _objective,
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

  // Viral Energy color system - removed local functions, using imported utilities

  return (
    <div className={cn("space-y-8", className)}>
      {hooks.map((hook, index) => {
        const scorePercentage = (hook.score / 5) * 100
        const isFavorite = favoriteIds.has(`${index}`)
        const viralScoreColors = getViralScoreColor(hook.score)
        const platformGlow = platform ? getPlatformGlow(platform) : ''

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={cn("overflow-hidden", platformGlow)}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {platform && (
                        <Badge className={getPlatformColor(platform)}>
                          {formatPlatformName(platform)}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs bg-[hsl(var(--viral-cyan)/0.2)] text-[hsl(var(--viral-cyan))] border-[hsl(var(--viral-cyan)/0.3)]">
                        {hook.hookCategory.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPsychologyDriverColor(hook.psychologicalDriver)}>
                        <Brain className="w-3 h-3 mr-1" />
                        {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge className={getViralRiskColor(hook.riskFactor)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {hook.riskFactor.toUpperCase()} Risk
                      </Badge>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-3">
                      Hook #{index + 1} 
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        viralScoreColors.background,
                        viralScoreColors.textColor,
                        viralScoreColors.animation
                      )}>
                        {hook.score.toFixed(1)}/5.0
                      </div>
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFavoriteToggle?.(index)}
                      className={isFavorite ? "bg-[hsl(var(--viral-pink))] hover:bg-[hsl(var(--viral-pink))/0.9]" : ""}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                {/* Quality Score Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Quality Score</span>
                    <span className="font-medium text-[hsl(var(--viral-gold))]">{hook.score.toFixed(1)}/5.0</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={scorePercentage} 
                      className={cn(
                        "h-3 rounded-full overflow-hidden",
                        viralScoreColors.animation === 'viral-glow-high' && 'viral-shimmer'
                      )}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Tri-Modal Components Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Verbal Hook */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[hsl(var(--viral-cyan)/0.2)] rounded-lg flex items-center justify-center">
                          <Mic className="w-4 h-4 text-[hsl(var(--viral-cyan))]" />
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
                        className="border-[hsl(var(--viral-cyan))] text-[hsl(var(--viral-cyan))] hover:bg-[hsl(var(--viral-cyan)/0.1)]"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-4 bg-[hsl(var(--viral-cyan)/0.05)] dark:bg-[hsl(var(--viral-cyan)/0.1)] rounded-lg border border-[hsl(var(--viral-cyan)/0.2)]">
                      <p className="text-sm leading-relaxed">{hook.verbalHook}</p>
                    </div>
                  </div>

                  {/* Visual Hook */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[hsl(var(--satisfaction)/0.2)] rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-[hsl(var(--satisfaction))]" />
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
                          className="border-[hsl(var(--satisfaction))] text-[hsl(var(--satisfaction))] hover:bg-[hsl(var(--satisfaction)/0.1)]"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4 bg-[hsl(var(--satisfaction)/0.05)] dark:bg-[hsl(var(--satisfaction)/0.1)] rounded-lg border border-[hsl(var(--satisfaction)/0.2)] min-h-[80px] flex items-center">
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
                        <div className="w-8 h-8 bg-[hsl(var(--viral-purple)/0.2)] rounded-lg flex items-center justify-center">
                          <Type className="w-4 h-4 text-[hsl(var(--viral-purple))]" />
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
                          className="border-[hsl(var(--viral-purple))] text-[hsl(var(--viral-purple))] hover:bg-[hsl(var(--viral-purple)/0.1)]"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4 bg-[hsl(var(--viral-purple)/0.05)] dark:bg-[hsl(var(--viral-purple)/0.1)] rounded-lg border border-[hsl(var(--viral-purple)/0.2)] min-h-[80px] flex items-center">
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
                        <div className="p-3 bg-[hsl(var(--tiktok-brand)/0.05)] dark:bg-[hsl(var(--tiktok-brand)/0.1)] rounded-lg border border-[hsl(var(--tiktok-brand)/0.2)] platform-glow-tiktok">
                          <div className="text-sm font-medium text-[hsl(var(--tiktok-brand))] mb-1">TikTok Cold Open</div>
                          <p className="text-sm">{hook.platformSpecific.tiktokColdOpen}</p>
                        </div>
                      )}
                      {hook.platformSpecific.instagramOverlay && (
                        <div className="p-3 bg-[hsl(var(--instagram-brand)/0.05)] dark:bg-[hsl(var(--instagram-brand)/0.1)] rounded-lg border border-[hsl(var(--instagram-brand)/0.2)] platform-glow-instagram">
                          <div className="text-sm font-medium text-[hsl(var(--instagram-brand))] mb-1">Instagram Overlay</div>
                          <p className="text-sm">{hook.platformSpecific.instagramOverlay}</p>
                        </div>
                      )}
                      {hook.platformSpecific.youtubeProofCue && (
                        <div className="p-3 bg-[hsl(var(--youtube-brand)/0.05)] dark:bg-[hsl(var(--youtube-brand)/0.1)] rounded-lg border border-[hsl(var(--youtube-brand)/0.2)] platform-glow-youtube">
                          <div className="text-sm font-medium text-[hsl(var(--youtube-brand))] mb-1">YouTube Proof Cue</div>
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
                      className="border-[hsl(var(--viral-gold))] text-[hsl(var(--viral-gold))] hover:bg-[hsl(var(--viral-gold)/0.1)]"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                    <Button 
                      onClick={() => onCopyHook?.(hook)}
                      className="viral-gradient-primary text-white hover:opacity-90 transition-opacity"
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