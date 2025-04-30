import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Profile } from '../../types';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Trash2 } from 'lucide-react'; // Import Trash2 icon

// --- Schema, Options, Helpers (No changes needed here) ---
const profileSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required'),
  email: z.string().email('Invalid email address'), 
  telegram_handle: z.string().optional().or(z.literal('')),
  language: z.enum(['EN', 'DE', 'UK']),
  current_situation: z.string().optional().or(z.literal('')),
  focused_problem: z.string().optional().or(z.literal('')),
  top_goals: z.array(z.string()).optional(),
  other_goal: z.string().optional().or(z.literal('')),
  assistant_name: z.string().optional().or(z.literal('')),
  persona: z.string().optional().or(z.literal('')), 
  tone: z.string().optional().or(z.literal('')), 
  gender: z.enum(['male', 'female']).optional(),
  response_length: z.enum(['short', 'medium', 'long']).optional(),
  content_style: z.string().optional().or(z.literal('')), 
  reminders_enabled: z.boolean().optional(),
  reminder_type: z.string().optional().or(z.literal('')),
  reminder_frequency: z.string().optional().or(z.literal('')),
  reminder_channel: z.string().optional().or(z.literal('')),
  reminder_time: z.string().optional().or(z.literal('')),
  avoid_topics: z.array(z.string()).optional(),
  other_avoid_topic: z.string().optional().or(z.literal('')),
  preferred_response_style: z.string().optional().or(z.literal('')),
  emoji_preference: z.enum(['none', 'less', 'more']).optional(),
});

const personaOptions = [
  { value: 'kind_friend', label: 'Kind Friend', description: 'Gentle, emotionally present, easygoing' },
  { value: 'wise_mentor', label: 'Wise Mentor', description: 'Calm and mature, speaks from experience' },
  { value: 'motivational_coach', label: 'Motivational Coach', description: 'Energetic, encouraging, goal-focused' },
  { value: 'therapeutic_listener', label: 'Therapeutic Listener', description: 'Focused on deep emotional understanding' },
  { value: 'cognitive_therapist', label: 'Cognitive Therapist', description: 'Uses CBT-like guidance, structured' },
  { value: 'supportive_minimalist', label: 'Supportive Minimalist', description: 'Simple, warm replies without overwhelming' },
  { value: 'compassionate_ally', label: 'Compassionate Ally', description: 'Empathic, human-first, very accepting' },
];

const toneOptions = [
  { value: 'warm', label: 'Warm', description: 'Friendly, cozy, supportive' },
  { value: 'professional', label: 'Professional', description: 'Calm, neutral, respectful' },
  { value: 'motivational', label: 'Motivational', description: 'Energetic, cheerleader-style' },
  { value: 'reflective', label: 'Reflective', description: 'Slower, introspective, thoughtful' },
  { value: 'playful', label: 'Playful', description: 'Light tone, a bit of humor' },
];

const contentStyleOptions = [
  { value: 'practical', label: 'Practical', description: 'Focused on real actions, tools, strategies' },
  { value: 'metaphorical', label: 'Metaphorical', description: 'Uses analogies and imagery to explain' },
  { value: 'theoretical', label: 'Theoretical', description: 'Explains psychological models behind things' },
  { value: 'narrative', label: 'Narrative', description: 'Responds in stories or metaphors' },
  { value: 'minimalist', label: 'Minimalist', description: 'Few words, clean structure' },
  { value: 'detailed', label: 'Detailed', description: 'Rich, structured responses' },
];

const getFullDescription = (
    value: string | undefined,
    options: { value: string; label: string; description: string }[]
): string | undefined => {
    if (!value) return undefined;
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? `${selectedOption.label} – ${selectedOption.description}` : value;
};

const getValueFromDescription = (
    descriptionString: string | undefined | null, 
    options: { value: string; label: string; description: string }[]
): string | undefined => {
    if (!descriptionString) return undefined;
    const foundOption = options.find(option => `${option.label} – ${option.description}` === descriptionString);
    return foundOption ? foundOption.value : descriptionString;
};
// --- End Schema, Options, Helpers ---


// Add onOpenDeleteDialog prop
interface ProfileFormProps {
  onOpenDeleteDialog: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onOpenDeleteDialog }) => {
  const { profile, loading, error, saveProfileToSupabase } = useProfile();
  const { user } = useAuth();

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: '',
      email: '',
      language: 'EN',
      gender: undefined,
      assistant_name: '',
      response_length: 'medium',
      reminders_enabled: false,
      top_goals: [],
      other_goal: '',
      avoid_topics: [],
      other_avoid_topic: '',
      emoji_preference: 'less',
      persona: '', 
      tone: '', 
      content_style: '', 
      current_situation: '',
      focused_problem: '',
      telegram_handle: '',
      reminder_type: '',
      reminder_frequency: '',
      reminder_channel: '',
      reminder_time: '',
      preferred_response_style: '',
    },
  });

  // Effect to reset form with profile data (no changes needed)
  useEffect(() => {
    const personaValue = getValueFromDescription(profile?.persona, personaOptions);
    const toneValue = getValueFromDescription(profile?.tone, toneOptions);
    const contentStyleValue = getValueFromDescription(profile?.content_style, contentStyleOptions);

    const defaultValues = {
      nickname: profile?.nickname || user?.nickname || '',
      email: profile?.email || user?.email || '',
      language: profile?.language || 'EN',
      gender: profile?.gender === 'male' || profile?.gender === 'female' ? profile.gender : undefined,
      assistant_name: profile?.assistant_name || '',
      response_length: profile?.response_length || 'medium',
      reminders_enabled: profile?.reminders_enabled || false,
      top_goals: profile?.top_goals || [],
      other_goal: profile?.other_goal || '',
      avoid_topics: profile?.avoid_topics || [],
      other_avoid_topic: profile?.other_avoid_topic || '',
      emoji_preference: profile?.emoji_preference || 'less',
      persona: personaValue || '', 
      tone: toneValue || '', 
      content_style: contentStyleValue || '', 
      current_situation: profile?.current_situation || '',
      focused_problem: profile?.focused_problem || '',
      telegram_handle: profile?.telegram_handle || '',
      reminder_type: profile?.reminder_type || '',
      reminder_frequency: profile?.reminder_frequency || '',
      reminder_channel: profile?.reminder_channel || '',
      reminder_time: profile?.reminder_time || '',
      preferred_response_style: profile?.preferred_response_style || '',
    };
    reset(defaultValues);
  }, [profile, user, reset]);

  // Watchers (no changes needed)
  const selectedPersonaValue = watch('persona');
  const selectedToneValue = watch('tone');
  const selectedContentStyleValue = watch('content_style');
  const selectedGender = watch('gender');
  const selectedEmojiPreference = watch('emoji_preference');
  const remindersEnabled = watch('reminders_enabled');

  // onSubmit (no changes needed)
  const onSubmit = async (data: Profile) => {
    if (!user) {
      console.error("User not logged in, cannot save profile.");
      return;
    }
    const fullPersona = getFullDescription(data.persona, personaOptions);
    const fullTone = getFullDescription(data.tone, toneOptions);
    const fullContentStyle = getFullDescription(data.content_style, contentStyleOptions);
    const dataToSave = {
      ...data,
      user_id: user.id, 
      persona: fullPersona,
      tone: fullTone,
      content_style: fullContentStyle,
    };
    delete (dataToSave as any).email;
    if (dataToSave.gender !== 'male' && dataToSave.gender !== 'female') {
        dataToSave.gender = undefined;
    }
    console.log("Data being sent to saveProfileToSupabase:", dataToSave); 
    await saveProfileToSupabase(dataToSave);
  };

  const goalOptions = [
    'Reduce anxiety', 'Improve mood', 'Better sleep', 'Manage stress',
    'Improve relationships', 'Increase productivity', 'Personal growth', 'Self-awareness',
  ];

  const avoidTopicOptions = [
    'Politics', 'Religion', 'Traumatic events', 'Financial advice',
    'Medical diagnoses', 'Legal advice',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="identity" className="w-full">
        <div className="mb-4 overflow-x-auto">
          <TabsList className="flex flex-wrap w-full">
            <TabsTrigger value="identity" className="flex-grow min-w-[100px] text-center">Identity</TabsTrigger>
            <TabsTrigger value="context" className="flex-grow min-w-[100px] text-center">Life Context</TabsTrigger>
            <TabsTrigger value="assistant" className="flex-grow min-w-[100px] text-center">Assistant Setup</TabsTrigger>
            <TabsTrigger value="reminders" className="flex-grow min-w-[100px] text-center">Reminders</TabsTrigger>
            <TabsTrigger value="additional" className="flex-grow min-w-[100px] text-center">Additional</TabsTrigger>
          </TabsList>
        </div>

        {/* Identity Tab Content */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>Basic Identity</CardTitle>
              <CardDescription>
                How would you like to be addressed and communicated with?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nickname */}
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input id="nickname" {...register('nickname')} placeholder="How should we call you?" />
                {errors.nickname && <p className="text-sm text-red-500">{errors.nickname.message}</p>}
              </div>
              {/* Email (Read Only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="Your email address" readOnly className="bg-muted/50 cursor-not-allowed" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              {/* Telegram */}
              <div className="space-y-2">
                <Label htmlFor="telegram_handle">Telegram Handle (Optional)</Label>
                <Input id="telegram_handle" {...register('telegram_handle')} placeholder="@yourusername" />
              </div>
              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select value={watch('language')} onValueChange={(value) => setValue('language', value as 'EN' | 'DE' | 'UK')}>
                  <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="DE">German</SelectItem>
                    <SelectItem value="UK">Ukrainian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- Delete Account Section --- */}
              <div className="pt-6 mt-6 border-t border-destructive/50">
                 <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                    Deleting your account is permanent and cannot be undone. All your profile data, chat history, and other associated information will be permanently removed.
                 </p>
                 <Button
                   type="button" // Important: Prevent form submission
                   variant="destructive"
                   onClick={onOpenDeleteDialog} // Call the handler passed from ProfilePage
                   className="w-full sm:w-auto"
                 >
                   <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
                 </Button>
              </div>
              {/* --- End Delete Account Section --- */}

            </CardContent>
          </Card>
        </TabsContent>

        {/* Context Tab Content (No changes) */}
        <TabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle>Life Context</CardTitle>
              <CardDescription>
                Help us understand your current situation and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Situation */}
              <div className="space-y-2">
                <Label htmlFor="current_situation">Current Situation</Label>
                <Textarea
                  id="current_situation"
                  {...register('current_situation')}
                  placeholder="Describe your current life situation"
                />
              </div>
              {/* Focused Problem */}
              <div className="space-y-2">
                <Label htmlFor="focused_problem">Focused Problem</Label>
                <Textarea
                  id="focused_problem"
                  {...register('focused_problem')}
                  placeholder="What specific challenge are you facing?"
                />
              </div>
              {/* Top Goals */}
              <div className="space-y-2">
                <Label>Top Goals (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {goalOptions.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={(watch('top_goals') || []).includes(goal)}
                        onCheckedChange={(checked) => {
                          const currentGoals = watch('top_goals') || [];
                          if (checked) {
                            setValue('top_goals', [...currentGoals, goal]);
                          } else {
                            setValue(
                              'top_goals',
                              currentGoals.filter((g) => g !== goal)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`goal-${goal}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {goal}
                      </label>
                    </div>
                  ))}
                </div>
                {/* Other Goal Input */}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="other_goal">Other Goal</Label>
                  <Input
                    id="other_goal"
                    {...register('other_goal')}
                    placeholder="Specify another goal..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assistant Setup Tab Content (No changes) */}
        <TabsContent value="assistant">
          <Card>
            <CardHeader>
              <CardTitle>Assistant Setup</CardTitle>
              <CardDescription>
                Customize how your assistant communicates with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Persona */}
              <div className="space-y-2">
                <Label htmlFor="persona">Assistant Persona</Label>
                 <p className="text-sm text-muted-foreground">🎭 "Who" the assistant is. Defines role, experience, and style.</p>
                <Select
                  value={selectedPersonaValue}
                  onValueChange={(value) => setValue('persona', value, { shouldValidate: true })} 
                >
                  <SelectTrigger id="persona">
                    <SelectValue placeholder="Select a persona...">
                      {personaOptions.find(o => o.value === selectedPersonaValue)?.label || "Select a persona..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {personaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} – <span className="text-muted-foreground text-xs">{option.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {errors.persona && (
                    <p className="text-sm text-red-500">{errors.persona.message}</p>
                  )}
              </div>
              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="tone">Communication Tone</Label>
                <p className="text-sm text-muted-foreground">🗣️ "How" they talk. Shapes language style and emotional expression.</p>
                <Select
                  value={selectedToneValue}
                  onValueChange={(value) => setValue('tone', value, { shouldValidate: true })}
                >
                  <SelectTrigger id="tone">
                     <SelectValue placeholder="Select a tone...">
                       {toneOptions.find(o => o.value === selectedToneValue)?.label || "Select a tone..."}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                         {option.label} – <span className="text-muted-foreground text-xs">{option.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {errors.tone && (
                    <p className="text-sm text-red-500">{errors.tone.message}</p>
                  )}
              </div>
              {/* Content Style */}
              <div className="space-y-2">
                <Label htmlFor="content_style">Content Style</Label>
                 <p className="text-sm text-muted-foreground">🎨 The "shape" of the answers. Dictates delivery of ideas.</p>
                <Select
                  value={selectedContentStyleValue}
                  onValueChange={(value) => setValue('content_style', value, { shouldValidate: true })}
                >
                  <SelectTrigger id="content_style">
                     <SelectValue placeholder="Select a content style...">
                       {contentStyleOptions.find(o => o.value === selectedContentStyleValue)?.label || "Select a content style..."}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {contentStyleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                         {option.label} – <span className="text-muted-foreground text-xs">{option.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {errors.content_style && (
                    <p className="text-sm text-red-500">{errors.content_style.message}</p>
                  )}
              </div>

              {/* Assistant Name and Gender remain the same */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Assistant Name */}
                <div className="space-y-2">
                  <Label htmlFor="assistant_name">Assistant Name (Optional)</Label>
                  <Input
                    id="assistant_name"
                    {...register('assistant_name')}
                    placeholder="Give your assistant a name"
                  />
                   {errors.assistant_name && (
                    <p className="text-sm text-red-500">{errors.assistant_name.message}</p>
                  )}
                </div>
                {/* Gender */}
                <div className="space-y-2">
                  <Label>Assistant Gender</Label>
                  <RadioGroup
                    value={selectedGender}
                    onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
                    className="flex space-x-4 pt-2" // Added pt-2 for alignment
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="gender-male" />
                      <Label htmlFor="gender-male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="gender-female" />
                      <Label htmlFor="gender-female">Female</Label>
                    </div>
                  </RadioGroup>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              {/* Response Length remains the same */}
              <div className="space-y-2">
                <Label>Response Length</Label>
                <RadioGroup
                  value={watch('response_length')}
                  onValueChange={(value) => setValue('response_length', value as 'short' | 'medium' | 'long')}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="length-short" />
                    <Label htmlFor="length-short">Short</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="length-medium" />
                    <Label htmlFor="length-medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="long" id="length-long" />
                    <Label htmlFor="length-long">Long</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders Tab Content (No changes) */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>
                Set up reminders to help you stay on track
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Reminders */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="reminders_enabled"
                  checked={remindersEnabled}
                  onCheckedChange={(checked) => setValue('reminders_enabled', checked)}
                />
                <Label htmlFor="reminders_enabled">Enable Reminders</Label>
              </div>
              {/* Reminder Settings (Conditional) */}
              {remindersEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reminder_type">Reminder Type</Label>
                    <Select
                      value={watch('reminder_type')}
                      onValueChange={(value) => setValue('reminder_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reminder type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check_in">Daily Check-in</SelectItem>
                        <SelectItem value="exercise">Practice Exercise</SelectItem>
                        <SelectItem value="reflection">Reflection Prompt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder_frequency">Frequency</Label>
                    <Select
                      value={watch('reminder_frequency')}
                      onValueChange={(value) => setValue('reminder_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder_channel">Reminder Channel</Label>
                    <Select
                      value={watch('reminder_channel')}
                      onValueChange={(value) => setValue('reminder_channel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="app">In-app</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder_time">Preferred Time</Label>
                    <Input
                      id="reminder_time"
                      type="time"
                      {...register('reminder_time')}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Tab Content (No changes) */}
        <TabsContent value="additional">
          <Card>
            <CardHeader>
              <CardTitle>Additional Preferences</CardTitle>
              <CardDescription>
                Fine-tune your experience with additional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topics to Avoid */}
              <div className="space-y-2">
                <Label>Topics to Avoid (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {avoidTopicOptions.map((topic) => (
                    <div key={topic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic}`}
                        checked={(watch('avoid_topics') || []).includes(topic)}
                        onCheckedChange={(checked) => {
                          const currentTopics = watch('avoid_topics') || [];
                          if (checked) {
                            setValue('avoid_topics', [...currentTopics, topic]);
                          } else {
                            setValue(
                              'avoid_topics',
                              currentTopics.filter((t) => t !== topic)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`topic-${topic}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {topic}
                      </label>
                    </div>
                  ))}
                </div>
                {/* Other Avoid Topic Input */}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="other_avoid_topic">Other Topic to Avoid</Label>
                  <Input
                    id="other_avoid_topic"
                    {...register('other_avoid_topic')}
                    placeholder="Specify another topic to avoid..."
                  />
                </div>
              </div>

              {/* Preferred Response Style */}
              <div className="space-y-2">
                <Label htmlFor="preferred_response_style">Preferred Response Style</Label>
                <Textarea
                  id="preferred_response_style"
                  {...register('preferred_response_style')}
                  placeholder="Any specific way you'd like responses to be structured?"
                />
              </div>

              {/* Emoji Preference */}
              <div className="space-y-2">
                <Label>Emoji Preference</Label>
                <p className="text-sm text-muted-foreground">How often should the assistant use emojis?</p>
                <RadioGroup
                  value={selectedEmojiPreference}
                  onValueChange={(value) => setValue('emoji_preference', value as 'none' | 'less' | 'more')}
                  className="flex space-x-4 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="emoji-none" />
                    <Label htmlFor="emoji-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="less" id="emoji-less" />
                    <Label htmlFor="emoji-less">Less</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="more" id="emoji-more" />
                    <Label htmlFor="emoji-more">More</Label>
                  </div>
                </RadioGroup>
                {errors.emoji_preference && (
                  <p className="text-sm text-red-500">{errors.emoji_preference.message}</p>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving... </>
          ) : ( 'Save Profile' )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
