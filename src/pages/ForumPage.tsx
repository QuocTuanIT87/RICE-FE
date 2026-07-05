import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  forumApi,
  usersApi,
  socialApi,
  authApi,
  forumStoriesApi,
  chatApi,
} from "@/services/api";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import VipAvatar from "@/components/VipAvatar";
import { VipMascotInline } from "@/components/VipMascots";
import { useSocket } from "@/contexts/SocketContext";
import {
  MessageSquare,
  Heart,
  Filter,
  Search,
  Award,
  TrendingUp,
  Crown,
  Sparkles,
  BookOpen,
  MessageCircle,
  Utensils,
  Share2,
  Send,
  Loader2,
  ThumbsUp,
  Image as ImageIcon,
  X,
  User,
  Trash,
  ChevronLeft,
  ChevronRight,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { swalToast } from "@/utils/swal";

const CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "general", label: "Tám chuyện" },
  { value: "review", label: "Review món ăn" },
  { value: "life", label: "Đời sống" },
  { value: "knowledge", label: "Kiến thức" },
];

const REACTION_TYPES = [
  {
    value: "like",
    emoji: "👍",
    label: "Thích",
    color: "text-blue-500 hover:text-blue-600 font-extrabold",
  },
  {
    value: "love",
    emoji: "❤️",
    label: "Yêu thích",
    color: "text-red-500 hover:text-red-650 font-extrabold",
  },
  {
    value: "haha",
    emoji: "😆",
    label: "Haha",
    color: "text-yellow-500 hover:text-yellow-600 font-extrabold",
  },
  {
    value: "wow",
    emoji: "😮",
    label: "Wow",
    color: "text-yellow-550 hover:text-yellow-600 font-extrabold",
  },
  {
    value: "sad",
    emoji: "😢",
    label: "Buồn",
    color: "text-blue-400 hover:text-blue-500 font-extrabold",
  },
  {
    value: "angry",
    emoji: "😡",
    label: "Phẫn nộ",
    color: "text-orange-550 hover:text-orange-600 font-extrabold",
  },
];

const getPromoCardTheme = (theme: string) => {
  switch (theme) {
    case "gold":
      return {
        cardBg:
          "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/5 border-amber-200/60",
        iconBg: "bg-amber-500/20 text-amber-600",
        titleText: "text-amber-900",
        descText: "text-amber-800/90",
        sparkleColor: "text-amber-500",
        buttonClass:
          "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-200/50",
      };
    case "emerald":
      return {
        cardBg:
          "bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/5 border-emerald-200/60",
        iconBg: "bg-emerald-500/20 text-emerald-600",
        titleText: "text-emerald-900",
        descText: "text-emerald-800/90",
        sparkleColor: "text-emerald-500",
        buttonClass:
          "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200/50",
      };
    case "dark":
      return {
        cardBg:
          "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-indigo-500/5 border-indigo-900",
        iconBg: "bg-indigo-500/20 text-indigo-400",
        titleText: "text-slate-100",
        descText: "text-slate-300",
        sparkleColor: "text-indigo-400",
        buttonClass:
          "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-950/50",
      };
    case "sakura":
      return {
        cardBg:
          "bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-pink-500/5 border-pink-200/60",
        iconBg: "bg-pink-500/20 text-pink-600",
        titleText: "text-pink-900",
        descText: "text-pink-850",
        sparkleColor: "text-pink-500",
        buttonClass:
          "bg-pink-500 hover:bg-pink-600 text-white shadow-pink-200/50",
      };
    case "ocean":
      return {
        cardBg:
          "bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-sky-500/5 border-sky-200/60",
        iconBg: "bg-sky-500/20 text-sky-600",
        titleText: "text-sky-900",
        descText: "text-sky-850",
        sparkleColor: "text-sky-500",
        buttonClass: "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200/50",
      };
    case "lava":
      return {
        cardBg:
          "bg-gradient-to-br from-red-500/10 via-rose-500/5 to-red-500/5 border-red-200/60",
        iconBg: "bg-red-500/20 text-red-600",
        titleText: "text-red-900",
        descText: "text-red-850",
        sparkleColor: "text-red-500",
        buttonClass: "bg-red-500 hover:bg-red-600 text-white shadow-red-200/50",
      };
    case "sunset":
      return {
        cardBg:
          "bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-rose-500/5 border-rose-200/60",
        iconBg: "bg-orange-500/20 text-rose-600",
        titleText: "text-rose-900",
        descText: "text-rose-850",
        sparkleColor: "text-rose-500",
        buttonClass:
          "bg-gradient-to-r from-orange-400 to-rose-500 hover:opacity-90 text-white shadow-rose-200/50",
      };
    case "cotton-candy":
      return {
        cardBg:
          "bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-sky-500/5 border-purple-200/60",
        iconBg: "bg-purple-500/20 text-purple-600",
        titleText: "text-purple-900",
        descText: "text-purple-850",
        sparkleColor: "text-purple-500",
        buttonClass:
          "bg-gradient-to-r from-purple-400 to-sky-500 hover:opacity-90 text-white shadow-purple-200/50",
      };
    case "cyberpunk":
      return {
        cardBg:
          "bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-cyan-500/5 border-pink-500/30",
        iconBg: "bg-pink-500/20 text-pink-400",
        titleText: "text-pink-400",
        descText: "text-cyan-400/80",
        sparkleColor: "text-cyan-400",
        buttonClass:
          "bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-90 text-white shadow-pink-500/30",
      };
    case "default":
    default:
      return {
        cardBg:
          "bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-orange-500/5 border-orange-200/60",
        iconBg: "bg-orange-500/20 text-orange-600",
        titleText: "text-orange-900",
        descText: "text-orange-850",
        sparkleColor: "text-orange-500",
        buttonClass:
          "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200/50",
      };
  }
};

export default function ForumPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();

  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });

  const currentUser = profileData?.data?.data;
  const isVip = currentUser?.hasMembership || false;
  const vipTheme = currentUser?.vipCosmetics?.vipTheme || "default";

  const cardTheme = getPromoCardTheme(isVip ? vipTheme : "default");
  const getProfileLink = (authorId?: string) => {
    const targetId = authorId || user?.id || user?._id;
    return targetId ? `/user/${targetId}` : "/profile";
  };
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  const { data: friendUsersResponse, isLoading: friendSearchLoading } =
    useQuery({
      queryKey: ["forumFriendSearch", friendSearchQuery],
      queryFn: () =>
        usersApi.searchUsers({ search: friendSearchQuery, limit: 8 }),
      enabled: friendSearchQuery.trim().length > 0,
    });

  const friendUsersList = (friendUsersResponse?.data?.data?.docs || []).filter(
    (u: any) => u.role !== "admin",
  );

  // Post form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  // Selected post for modal view
  const [selectedDetailPostId, setSelectedDetailPostId] = useState<
    string | null
  >(null);
  const [detailCommentContent, setDetailCommentContent] = useState("");

  // Reply states
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(
    null,
  );
  const [replyContent, setReplyContent] = useState("");

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Reaction modal states
  const [isReactionListOpen, setIsReactionListOpen] = useState(false);
  const [activeReactionPost, setActiveReactionPost] = useState<any | null>(
    null,
  );
  const [activeReactionTab, setActiveReactionTab] = useState<string>("all");

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // List of available static tracks for stories (20 tracks total)
  const AVAILABLE_MUSICS = [
    {
      id: "none",
      title: "Không chọn nhạc nền",
      url: "",
    },
    {
      id: "lofi-chill",
      title: "Lofi Foodie Chill 🎋",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "samba",
      title: "Samba de Janeiro 🇧🇷",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "messi-victory",
      title: "Ankara Victory 🏆",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: "siuuu-energetic",
      title: "SIUUU Energetic ⚡",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      id: "summer-vibes",
      title: "Summer Chill Vibes ☀️",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
    {
      id: "cafe-paris",
      title: "Cafe Paris Lounge ☕",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
    {
      id: "acoustic-sun",
      title: "Acoustic Sunshine 🌻",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    },
    {
      id: "cyberpunk-neon",
      title: "Cyberpunk Neon 👾",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    },
    {
      id: "synthwave",
      title: "Synthwave Ride 🏎️",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    },
    {
      id: "hiphop-beats",
      title: "Hip Hop Street Beats 🎧",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    },
    {
      id: "tropical",
      title: "Tropical House Party 🌴",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    },
    {
      id: "ukulele",
      title: "Happy Ukulele 🏖️",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    },
    {
      id: "jazz-piano",
      title: "Jazz Piano Night 🎹",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    },
    {
      id: "cinematic",
      title: "Epic Cinematic Orchestral ⚔️",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    },
    {
      id: "ocean",
      title: "Relaxing Ocean Waves 🌊",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    },
    {
      id: "rock-rev",
      title: "Rock Revolution 🎸",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    },
    {
      id: "rain-sg",
      title: "Mưa Sài Gòn Lặng Lẽ 🌧️",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "valley",
      title: "Thung Lũng Hoa Đào 🌸",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
    {
      id: "cross-country",
      title: "Phượt Xuyên Việt 🏍️",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    },
    {
      id: "chicken-rice",
      title: "Siuuu Cơm Gà Nướng 🍗",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    },
  ];

  // Story states
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(
    null,
  );
  const [storyProgress, setStoryProgress] = useState(0);

  // Music States & Refs
  const [selectedMusicId, setSelectedMusicId] = useState<string>("none");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const viewerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Story Reply States & Mutation
  const [replyText, setReplyText] = useState("");
  const sendReplyMutation = useMutation({
    mutationFn: (formData: FormData) => chatApi.sendMessage(formData),
    onSuccess: () => {
      toast({
        title: "Đã gửi phản hồi",
        description: "Phản hồi đã gửi thẳng vào tin nhắn riêng (inbox) của người đăng tin!",
      });
      setReplyText("");
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi gửi phản hồi",
        description: err.response?.data?.error?.message || "Không thể gửi phản hồi, vui lòng thử lại.",
      });
    },
  });

  const handleSendReply = () => {
    if (!replyText.trim() || activeGroupIndex === null) return;
    const currentGroup = storyGroups[activeGroupIndex];
    if (!currentGroup) return;
    const currentStory = currentGroup.stories[activeStoryIndex];
    if (!currentStory) return;

    const receiverId = currentStory.userId?._id;
    if (!receiverId) return;

    if (receiverId === currentUser?._id) {
      toast({
        variant: "destructive",
        title: "Không thể tự phản hồi",
        description: "Đạo hữu không thể tự gửi phản hồi story cho chính mình nhé!",
      });
      return;
    }

    const replyData = {
      isStoryReply: true,
      storyId: currentStory._id,
      imageUrl: currentStory.imageUrl,
      caption: currentStory.caption || "",
      text: replyText.trim(),
      groupUserId: currentStory.userId?._id
    };

    const formData = new FormData();
    formData.append("receiverId", receiverId);
    formData.append("content", JSON.stringify(replyData));

    sendReplyMutation.mutate(formData);
  };

  const { data: storiesResponse } = useQuery({
    queryKey: ["forumStories"],
    queryFn: () => forumStoriesApi.getStories(),
  });
  const stories: any[] = storiesResponse?.data?.data || [];

  // Nhóm stories theo user để hiển thị 1 avatar đại diện cho mỗi user trên thanh Story Bar
  const storyGroups = stories.reduce((groups: any[], story) => {
    const userId = story.userId?._id;
    if (!userId) return groups;
    let group = groups.find((g) => g.userId === userId);
    if (!group) {
      group = {
        userId,
        user: story.userId,
        stories: [],
      };
      groups.push(group);
    }
    group.stories.push(story);
    return groups;
  }, []);

  const createStoryMutation = useMutation({
    mutationFn: (formData: FormData) => forumStoriesApi.createStory(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumStories"] });
      setIsCreateStoryOpen(false);
      setStoryCaption("");
      setStoryImageFile(null);
      if (storyImagePreview) URL.revokeObjectURL(storyImagePreview);
      setStoryImagePreview(null);
      setSelectedMusicId("none");

      // Dừng âm thanh preview khi đóng form
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }

      swalToast({
        title: "Tin của bạn đã được đăng lên thành công!",
        icon: "success",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi đăng tin",
        description:
          err.response?.data?.error?.message ||
          "Không thể đăng tin, vui lòng thử lại.",
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (id: string) => forumStoriesApi.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumStories"] });
      setActiveGroupIndex(null);
      setActiveStoryIndex(0);
      swalToast({
        title: "Đã gỡ tin thành công!",
        icon: "success",
      });
    },
  });

  useEffect(() => {
    return () => {
      if (storyImagePreview) {
        URL.revokeObjectURL(storyImagePreview);
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (viewerAudioRef.current) {
        viewerAudioRef.current.pause();
      }
    };
  }, [storyImagePreview]);

  // Tự động mở Story Viewer nếu có query parameters từ Chat chuyển qua
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("storyId");
    const groupUserId = params.get("groupUserId");
    if (storyId && groupUserId && storyGroups.length > 0) {
      const gIdx = storyGroups.findIndex((g: any) => g.userId === groupUserId);
      if (gIdx !== -1) {
        const sIdx = storyGroups[gIdx].stories.findIndex(
          (s: any) => s._id === storyId,
        );
        if (sIdx !== -1) {
          setActiveGroupIndex(gIdx);
          setActiveStoryIndex(sIdx);

          // Clear parameters from address bar to avoid reopening on refresh
          const newUrl =
            window.location.protocol +
            "//" +
            window.location.host +
            window.location.pathname;
          window.history.replaceState({ path: newUrl }, "", newUrl);
        }
      }
    }
  }, [storiesResponse, storyGroups]);

  // Xử lý chọn nhạc thử trong dialog tạo story
  const handleSelectMusic = (musicId: string) => {
    setSelectedMusicId(musicId);

    // Dừng âm thanh preview cũ
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    const music = AVAILABLE_MUSICS.find((m) => m.id === musicId);
    if (music && music.url) {
      const audio = new Audio(music.url);
      audio.volume = 0.4;
      audio.play().catch((e) => console.log("Không thể phát nhạc thử:", e));
      previewAudioRef.current = audio;
    }
  };

  // Quản lý phát nhạc trong Story Viewer Modal
  useEffect(() => {
    if (activeGroupIndex === null) {
      // Dừng phát nhạc khi đóng modal xem story
      if (viewerAudioRef.current) {
        viewerAudioRef.current.pause();
        viewerAudioRef.current = null;
      }
      return;
    }

    const currentGroup = storyGroups[activeGroupIndex];
    if (!currentGroup) return;
    const currentStory = currentGroup.stories[activeStoryIndex];
    if (!currentStory) return;

    // Dừng track cũ
    if (viewerAudioRef.current) {
      viewerAudioRef.current.pause();
      viewerAudioRef.current = null;
    }

    // Phát track mới nếu có nhạc nền
    if (currentStory.musicUrl) {
      const audio = new Audio(currentStory.musicUrl);
      audio.loop = true;
      audio.volume = isMuted ? 0 : 0.4;
      audio.play().catch((e) => console.log("Không thể tự động phát nhạc:", e));
      viewerAudioRef.current = audio;
    }
  }, [activeGroupIndex, activeStoryIndex, stories.length]);

  // Đồng bộ bật/tắt tiếng
  useEffect(() => {
    if (viewerAudioRef.current) {
      viewerAudioRef.current.volume = isMuted ? 0 : 0.4;
    }
  }, [isMuted]);

  useEffect(() => {
    if (activeGroupIndex === null) return;
    setStoryProgress(0);
    const duration = 10000; // 10s
    const intervalTime = 100; // 100ms
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextStory();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [activeGroupIndex, activeStoryIndex, stories.length]);

  const handleNextStory = () => {
    if (activeGroupIndex === null) return;
    const currentGroup = storyGroups[activeGroupIndex];
    if (!currentGroup) return;

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      // Chuyển sang user tiếp theo
      if (activeGroupIndex < storyGroups.length - 1) {
        setActiveGroupIndex(activeGroupIndex + 1);
        setActiveStoryIndex(0);
      } else {
        setActiveGroupIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (activeGroupIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      // Quay lại user trước đó và xem story cuối cùng của user đó
      if (activeGroupIndex > 0) {
        const prevGroup = storyGroups[activeGroupIndex - 1];
        setActiveGroupIndex(activeGroupIndex - 1);
        setActiveStoryIndex(prevGroup.stories.length - 1);
      }
    }
  };

  const handleStoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Định dạng không hợp lệ",
        description: "Vui lòng chọn một tệp hình ảnh.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Tệp quá lớn",
        description: "Dung lượng ảnh tối đa là 5MB.",
      });
      return;
    }

    setStoryImageFile(file);
    if (storyImagePreview) URL.revokeObjectURL(storyImagePreview);
    setStoryImagePreview(URL.createObjectURL(file));
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyImageFile) {
      toast({
        variant: "destructive",
        title: "Thiếu ảnh",
        description: "Vui lòng chọn hình ảnh để đăng story.",
      });
      return;
    }
    const formData = new FormData();
    formData.append("image", storyImageFile);
    formData.append("caption", storyCaption);

    const currentMusic = AVAILABLE_MUSICS.find((m) => m.id === selectedMusicId);
    if (currentMusic && currentMusic.id !== "none") {
      formData.append("musicTitle", currentMusic.title);
      formData.append("musicUrl", currentMusic.url);
    }

    createStoryMutation.mutate(formData);
  };

  const getVipGlowBorderClass = (themeName: string) => {
    switch (themeName) {
      case "gold":
        return "ring-2 ring-amber-400 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(245,158,11,0.6)]";
      case "sakura":
        return "ring-2 ring-pink-400 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(244,114,182,0.6)]";
      case "emerald":
        return "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(16,185,129,0.6)]";
      case "lava":
        return "ring-2 ring-red-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      case "cyberpunk":
        return "ring-2 ring-purple-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(168,85,247,0.6)]";
      case "ice":
        return "ring-2 ring-sky-400 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(56,189,248,0.6)]";
      case "ocean":
        return "ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(59,130,246,0.6)]";
      case "violet":
        return "ring-2 ring-violet-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(139,92,246,0.6)]";
      case "rose":
        return "ring-2 ring-rose-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(244,63,94,0.6)]";
      case "sunset":
        return "ring-2 ring-orange-500 ring-offset-2 ring-offset-white shadow-[0_0_8px_rgba(249,115,22,0.6)]";
      default:
        return "ring-2 ring-orange-500 ring-offset-2 ring-offset-white";
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePostCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    };

    const handleCommentCreated = (data: { postId: string; comment: any }) => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      if (selectedDetailPostId === data.postId) {
        queryClient.invalidateQueries({
          queryKey: ["forumPostDetail", data.postId],
        });
      }
    };

    const handleReactionUpdated = (data: {
      targetType: "post" | "comment";
      targetId: string;
      postId?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      if (selectedDetailPostId) {
        if (
          (data.targetType === "post" &&
            data.targetId === selectedDetailPostId) ||
          (data.targetType === "comment" &&
            data.postId === selectedDetailPostId)
        ) {
          queryClient.invalidateQueries({
            queryKey: ["forumPostDetail", selectedDetailPostId],
          });
        }
      }
    };

    const handleStoryCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["forumStories"] });
    };

    const handleStoryDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ["forumStories"] });
    };

    socket.on("forum_post_created", handlePostCreated);
    socket.on("forum_comment_created", handleCommentCreated);
    socket.on("forum_reaction_updated", handleReactionUpdated);
    socket.on("forum_story_created", handleStoryCreated);
    socket.on("forum_story_deleted", handleStoryDeleted);

    return () => {
      socket.off("forum_post_created", handlePostCreated);
      socket.off("forum_comment_created", handleCommentCreated);
      socket.off("forum_reaction_updated", handleReactionUpdated);
      socket.off("forum_story_created", handleStoryCreated);
      socket.off("forum_story_deleted", handleStoryDeleted);
    };
  }, [socket, selectedDetailPostId, queryClient]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Định dạng không hợp lệ",
        description: "Vui lòng chọn một tệp hình ảnh.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Tệp quá lớn",
        description: "Dung lượng ảnh tối đa là 5MB.",
      });
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Fetch posts
  const { data: postsResponse, isLoading } = useQuery({
    queryKey: ["forumPosts", selectedCategory],
    queryFn: () =>
      forumApi.getPosts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 50,
      }),
  });

  const posts = postsResponse?.data.data?.docs || [];

  // Fetch selected post details for modal
  const { data: detailResponse, isLoading: detailLoading } = useQuery({
    queryKey: ["forumPostDetail", selectedDetailPostId],
    queryFn: () => forumApi.getPostById(selectedDetailPostId || ""),
    enabled: !!selectedDetailPostId,
  });

  const detailPost = detailResponse?.data.data?.post;
  const detailComments = detailResponse?.data.data?.comments || [];

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: FormData) => forumApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      setIsCreateOpen(false);
      setTitle("");
      setContent("");
      setCategory("general");
      setImageFile(null);
      setImagePreview(null);
      toast({
        title: "Đăng bài thành công!",
        description: "Bài viết của bạn đã được đăng lên diễn đàn.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Không thể đăng bài",
        description:
          err.response?.data?.error?.message ||
          "Vui lòng kiểm tra lại nội dung.",
      });
    },
  });

  // React to post mutation
  const reactPostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: string }) =>
      forumApi.reactPost(postId, type),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      queryClient.invalidateQueries({ queryKey: ["forumPostDetail", postId] });
    },
  });

  const handleReactPost = (
    e: React.MouseEvent,
    postId: string,
    type: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    reactPostMutation.mutate({ postId, type });
  };

  // React to comment mutation
  const reactCommentMutation = useMutation({
    mutationFn: ({ commentId, type }: { commentId: string; type: string }) =>
      forumApi.reactComment(commentId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["forumPostDetail", selectedDetailPostId],
      });
    },
  });

  const handleReactComment = (commentId: string, type: string) => {
    reactCommentMutation.mutate({ commentId, type });
  };

  // Create comment mutation for modal
  const createCommentMutation = useMutation({
    mutationFn: ({
      postId,
      content,
      parentId,
    }: {
      postId: string;
      content: string;
      parentId?: string;
    }) => forumApi.createComment(postId, content, parentId),
    onSuccess: () => {
      setDetailCommentContent("");
      setReplyContent("");
      setReplyingCommentId(null);
      queryClient.invalidateQueries({
        queryKey: ["forumPostDetail", selectedDetailPostId],
      });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
      toast({
        title: "Bình luận thành công!",
        description: "Bình luận của bạn đã được đăng.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi bình luận",
        description:
          err.response?.data?.error?.message || "Vui lòng nhập lại bình luận.",
      });
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());
    formData.append("category", category);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    createPostMutation.mutate(formData);
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!selectedDetailPostId) return;
    createCommentMutation.mutate({
      postId: selectedDetailPostId,
      content: replyContent.trim(),
      parentId,
    });
  };

  const handleShare = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/forum/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    swalToast({
      title: "Đã sao chép liên kết bài viết!",
      icon: "success",
    });
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Compute hot posts dynamically on the client side
  const hotPosts = [...posts]
    .sort(
      (a, b) =>
        (b.commentsCount || 0) +
        (b.likes?.length || 0) -
        ((a.commentsCount || 0) + (a.likes?.length || 0)),
    )
    .slice(0, 4);

  // Helper to extract active user's reaction from post/comment
  const getMyReaction = (reactions?: any[]) => {
    if (!user || !reactions) return null;
    const currentUserId = user.id || user._id;
    return reactions.find((r) => (r.userId?._id || r.userId) === currentUserId);
  };

  // Helper to render reaction summary icons (👍❤️😆) and count
  const renderReactionSummary = (post: any) => {
    const reactions = post?.reactions || [];
    if (reactions.length === 0) return null;

    // Count unique reaction types
    const counts: Record<string, number> = {};
    reactions.forEach((r: any) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });

    const sortedTypes = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a],
    );

    const reactionNamesToShow = reactions.slice(0, 10);
    const remainingCount = reactions.length - 10;

    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center -space-x-1 select-none">
          {sortedTypes.slice(0, 3).map((type) => {
            const config = REACTION_TYPES.find((rt) => rt.value === type);
            return (
              <span
                key={type}
                className="text-xs filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
              >
                {config?.emoji || "👍"}
              </span>
            );
          })}
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            setActiveReactionPost(post);
            setActiveReactionTab("all");
            setIsReactionListOpen(true);
          }}
          className="relative group hover:underline font-bold text-gray-500 text-[10px] cursor-pointer"
        >
          {reactions.length} cảm xúc
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-[10px] p-2.5 rounded-xl shadow-xl z-50 min-w-[140px] pointer-events-none transition-all duration-300">
            <div className="font-extrabold text-orange-400 mb-1 border-b border-white/10 pb-1 text-center">
              Người bày tỏ cảm xúc
            </div>
            <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-1">
              {reactionNamesToShow.map((r: any, idx: number) => {
                const reactorName = r.userId?.name || "Ẩn danh";
                const emoji =
                  REACTION_TYPES.find((rt) => rt.value === r.type)?.emoji ||
                  "👍";
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="shrink-0">{emoji}</span>
                    <span className="truncate max-w-[120px] font-medium">
                      {reactorName}
                    </span>
                  </div>
                );
              })}
              {remainingCount > 0 && (
                <div className="text-[9px] text-gray-400 italic text-center mt-1 border-t border-white/5 pt-1">
                  + {remainingCount} người khác
                </div>
              )}
            </div>
          </div>
        </span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "max-w-6xl mx-auto space-y-6 transition-all duration-300",
        isVip && vipTheme !== "default" && `theme-${vipTheme}`,
      )}
    >
      {/* Forum Header */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            handleRemoveImage();
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl rounded-2xl bg-white">
          <form onSubmit={handleCreatePost}>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900">
                Viết Bài Thảo Luận Mới
              </DialogTitle>
              <DialogDescription>
                Chia sẻ ý kiến hoặc phản hồi món ăn cùng các đồng nghiệp trong
                công ty.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="post-title" className="font-bold text-gray-700">
                  Tiêu đề bài đăng
                </Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề ngắn gọn xúc tích..."
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="post-category"
                  className="font-bold text-gray-700"
                >
                  Chủ đề
                </Label>
                <select
                  id="post-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="general">Tám chuyện</option>
                  <option value="review">Review món ăn</option>
                  <option value="life">Đời sống</option>
                  <option value="knowledge">Kiến thức</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="post-content"
                  className="font-bold text-gray-700"
                >
                  Nội dung
                </Label>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hãy viết gì đó vui vẻ hoặc review món cơm hôm nay..."
                  rows={12}
                  className="w-full text-sm rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y min-h-[240px]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">
                  Hình ảnh đính kèm (Tùy chọn)
                </Label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 max-h-[180px] bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain max-h-[180px]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-500/50 hover:bg-orange-50/10 transition-all select-none">
                    <ImageIcon className="text-gray-400 mb-1" size={20} />
                    <span className="text-xs text-gray-500 font-bold">
                      Chọn hình ảnh để tải lên
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      JPEG, PNG, WEBP (Tối đa 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  handleRemoveImage();
                }}
                className="rounded-xl border-gray-200 text-gray-500 font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
              >
                Đăng bài
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================== STORY BAR ===================== */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 px-1">
          <Sparkles size={16} className="text-orange-500" />
          Tin 24h
        </h3>
        <div className="flex gap-4 overflow-x-auto scrollbar-none py-1 select-none">
          {/* Create Story Button Card */}
          <div
            onClick={() => setIsCreateStoryOpen(true)}
            className="flex-shrink-0 w-24 h-36 rounded-2xl border border-dashed border-gray-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center cursor-pointer group"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center transition-all group-hover:scale-110",
                isVip && vipTheme !== "default" && "bg-primary/10 text-primary",
              )}
            >
              <span className="text-xl font-bold">+</span>
            </div>
            <span className="text-[11px] font-extrabold text-gray-600 mt-2">
              Tạo tin
            </span>
          </div>

          {/* Stories List Grouped by User */}
          {storyGroups.map((group: any, index: number) => {
            const storyUser = group.user;
            const latestStory = group.stories[0]; // Story mới nhất
            const isOwner = storyUser?._id === currentUser?._id;
            const userTheme = storyUser?.vipCosmetics?.vipTheme || "default";

            return (
              <div
                key={group.userId}
                onClick={() => {
                  setActiveGroupIndex(index);
                  setActiveStoryIndex(0);
                }}
                className="flex-shrink-0 w-24 h-36 rounded-2xl overflow-hidden relative cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group bg-gray-100"
              >
                {/* Background Image of the first story */}
                <img
                  src={latestStory.imageUrl}
                  alt={storyUser?.name || "Story"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Black Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Avatar Icon with Vip Glow Border */}
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full overflow-hidden border border-white",
                      storyUser?.hasMembership &&
                        getVipGlowBorderClass(userTheme),
                    )}
                  >
                    <img
                      src={storyUser?.avatar || "/default-avatar.png"}
                      alt={storyUser?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Caption (optional) */}
                {latestStory.caption && (
                  <p className="absolute inset-x-2 bottom-6 text-[10px] text-white font-medium line-clamp-2 text-center drop-shadow-sm leading-tight">
                    {latestStory.caption}
                  </p>
                )}

                {/* User Name */}
                <span className="absolute inset-x-2 bottom-1.5 text-[9px] text-white font-extrabold truncate drop-shadow-sm text-center">
                  {isOwner ? "Tin của bạn" : storyUser?.name}
                </span>
              </div>
            );
          })}

          {storyGroups.length === 0 && (
            <div className="flex items-center justify-center flex-1 h-36 text-gray-400 text-xs font-bold">
              Chưa có tin nào. Hãy là người đầu tiên đăng tin hôm nay!
            </div>
          )}
        </div>
      </div>

      {/* ===================== STORY VIEWER MODAL ===================== */}
      {activeGroupIndex !== null &&
        storyGroups[activeGroupIndex] &&
        (() => {
          const currentGroup = storyGroups[activeGroupIndex];
          const currentStory = currentGroup.stories[activeStoryIndex];
          if (!currentStory) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-in fade-in duration-200">
              <div className="relative w-full max-w-md h-[90vh] md:h-[80vh] flex flex-col justify-between overflow-hidden md:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
                {/* Top Area: Progress Bar and Header */}
                <div className="p-4 bg-gradient-to-b from-black/80 to-transparent z-10 space-y-3">
                  {/* Progress Bar Container for the current user's stories ONLY */}
                  <div className="flex gap-1.5 h-[3px] w-full">
                    {currentGroup.stories.map((_: any, idx: number) => {
                      let width = "0%";
                      if (idx < activeStoryIndex) width = "100%";
                      else if (idx === activeStoryIndex)
                        width = `${storyProgress}%`;

                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-slate-700/50 h-full overflow-hidden rounded-full"
                        >
                          <div
                            className="bg-white h-full transition-all duration-100 ease-linear"
                            style={{ width }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Story Header */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full overflow-hidden border border-white",
                          currentStory.userId?.hasMembership &&
                            getVipGlowBorderClass(
                              currentStory.userId?.vipCosmetics?.vipTheme ||
                                "default",
                            ),
                        )}
                      >
                        <img
                          src={
                            currentStory.userId?.avatar || "/default-avatar.png"
                          }
                          alt={currentStory.userId?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold truncate max-w-[180px]">
                          {currentStory.userId?.name}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-gray-300 font-medium">
                            {formatDistanceToNow(
                              new Date(currentStory.createdAt),
                              {
                                addSuffix: true,
                                locale: vi,
                              },
                            )}
                          </span>
                          {currentStory.musicTitle && (
                            <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold mt-0.5 animate-pulse">
                              <Music
                                size={10}
                                className="animate-bounce text-orange-500"
                              />
                              <span className="truncate max-w-[150px]">
                                {currentStory.musicTitle}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Header Buttons: Mute, Delete (if owner) and Close */}
                    <div className="flex items-center gap-2">
                      {currentStory.musicUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(!isMuted);
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                          {isMuted ? (
                            <VolumeX size={16} />
                          ) : (
                            <Volume2 size={16} />
                          )}
                        </button>
                      )}
                      {currentStory.userId?._id === currentUser?._id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Bạn có chắc chắn muốn gỡ tin này?",
                              )
                            ) {
                              deleteStoryMutation.mutate(currentStory._id);
                            }
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-all"
                          title="Gỡ tin"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setActiveGroupIndex(null)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle Area: Story Image */}
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-950">
                  <img
                    src={currentStory.imageUrl}
                    alt="Story content"
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay caption */}
                  {currentStory.caption && (
                    <div className="absolute bottom-20 inset-x-6 z-10 text-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-lg text-white text-sm font-bold drop-shadow leading-relaxed animate-in slide-in-from-bottom duration-300">
                      {currentStory.caption}
                    </div>
                  )}
                </div>

                {/* Navigation Click Zones */}
                <div className="absolute inset-x-0 top-20 bottom-20 z-10 flex">
                  {/* Left Zone: Prev */}
                  <div
                    onClick={handlePrevStory}
                    className="w-1/3 h-full cursor-w-resize"
                  />
                  {/* Right Zone: Next */}
                  <div
                    onClick={handleNextStory}
                    className="w-2/3 h-full cursor-e-resize"
                  />
                </div>

                {/* Navigation Buttons (Left/Right Chevrons) */}
                {(activeStoryIndex > 0 || activeGroupIndex > 0) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevStory();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all border border-white/10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {(activeStoryIndex < currentGroup.stories.length - 1 ||
                  activeGroupIndex < storyGroups.length - 1) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextStory();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all border border-white/10"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}

                {/* Bottom Area: Quick Reply Box */}
                {currentStory.userId?._id !== currentUser?._id && (
                  <div className="p-4 bg-gradient-to-t from-black/80 to-transparent z-10 flex gap-2 items-center">
                    <Input
                      placeholder={`Phản hồi ${currentStory.userId?.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white rounded-full h-10 px-4 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendReply();
                        }
                      }}
                      disabled={sendReplyMutation.isPending}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendReply}
                      disabled={sendReplyMutation.isPending || !replyText.trim()}
                      className="rounded-full bg-white text-black hover:bg-white/90 flex-shrink-0"
                    >
                      {sendReplyMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* ===================== CREATE STORY DIALOG ===================== */}
      <Dialog
        open={isCreateStoryOpen}
        onOpenChange={(open) => {
          setIsCreateStoryOpen(open);
          if (!open) {
            setStoryCaption("");
            setStoryImageFile(null);
            if (storyImagePreview) URL.revokeObjectURL(storyImagePreview);
            setStoryImagePreview(null);
            setSelectedMusicId("none");
            if (previewAudioRef.current) {
              previewAudioRef.current.pause();
              previewAudioRef.current = null;
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl rounded-3xl bg-white border border-gray-100 text-gray-800 shadow-2xl p-8">
          <form onSubmit={handleCreateStory}>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Sparkles size={24} className="text-orange-500 animate-pulse" />
                Tạo Tin (Story) Mới
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs">
                Đăng những bức ảnh khoảnh khắc đẹp ngày hôm nay. Tin sẽ tự động
                gỡ bỏ sau 24h.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-6">
              {/* Cột trái: Live Preview Card (chỉ hiện trên Desktop) */}
              <div className="md:col-span-2 flex flex-col items-center justify-center border-r border-gray-100 pr-8 md:flex">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Xem trước giao diện
                </span>
                {storyImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-50 aspect-[9/16] w-full max-w-[260px] max-h-[460px] shadow-lg group">
                    <img
                      src={storyImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover animate-in fade-in duration-300"
                    />
                    {/* Live Preview Text overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                      {storyCaption ? (
                        <p className="text-[11px] text-white font-black text-center drop-shadow-md leading-tight line-clamp-4 bg-black/45 backdrop-blur-[2px] p-2.5 rounded-xl border border-white/5 animate-in slide-in-from-bottom duration-250">
                          {storyCaption}
                        </p>
                      ) : (
                        <span className="text-[9px] text-slate-300 font-medium text-center italic">
                          Chưa nhập caption...
                        </span>
                      )}
                      {selectedMusicId !== "none" && (
                        <div className="flex items-center justify-center gap-1 text-[8px] text-orange-400 font-bold mt-2 animate-pulse bg-black/40 py-1 px-1.5 rounded-full border border-white/5">
                          <Music size={8} className="animate-bounce" />
                          <span className="truncate max-w-[120px]">
                            {
                              AVAILABLE_MUSICS.find(
                                (m) => m.id === selectedMusicId,
                              )?.title
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-gray-250 bg-slate-50 aspect-[9/16] w-full max-w-[260px] max-h-[460px] flex flex-col items-center justify-center p-4 text-center text-gray-400">
                    <ImageIcon size={32} className="text-gray-300 mb-2" />
                    <span className="text-[11px] font-bold text-gray-400 leading-tight">
                      Chưa chọn ảnh
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1 leading-normal">
                      Chọn ảnh ở cột bên phải để xem trước
                    </span>
                  </div>
                )}
              </div>

              {/* Cột phải: Controls (Chọn ảnh, Caption, Nhạc) */}
              <div className="md:col-span-3 space-y-7">
                {/* 1. Image selector */}
                <div className="grid gap-2.5">
                  <Label className="font-bold text-gray-600 text-xs uppercase tracking-wider">
                    1. Hình ảnh của tin
                  </Label>
                  {storyImagePreview ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-gray-150 shadow-sm">
                      <div className="w-14 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-slate-200">
                        <img
                          src={storyImagePreview}
                          alt="Thumb"
                          className="w-full h-full object-cover animate-in zoom-in-95 duration-200"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-700 truncate">
                          {storyImageFile?.name}
                        </p>
                        <p className="text-[10px] text-gray-405 mt-1">
                          Dung lượng:{" "}
                          {(
                            (storyImageFile?.size || 0) /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryImageFile(null);
                          if (storyImagePreview)
                            URL.revokeObjectURL(storyImagePreview);
                          setStoryImagePreview(null);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-3 py-2 text-[10px] font-black transition-all shadow-sm active:scale-95"
                      >
                        Đổi ảnh khác
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-slate-50/50 rounded-2xl p-9 cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-300 select-none group text-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-all duration-300">
                        <ImageIcon size={20} />
                      </div>
                      <span className="text-xs text-gray-750 font-black group-hover:text-orange-500 transition-colors">
                        Chọn hình ảnh tải lên
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">
                        Hỗ trợ JPEG, PNG, WEBP (Tối đa 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoryImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 2. Caption */}
                <div className="grid gap-2.5">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="story-caption"
                      className="font-bold text-gray-600 text-xs uppercase tracking-wider"
                    >
                      2. Dòng cảm xúc đè lên ảnh
                    </Label>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {storyCaption.length}/100
                    </span>
                  </div>
                  <Input
                    id="story-caption"
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    placeholder="Nhập cảm xúc đè lên ảnh (Tối đa 100 ký tự)..."
                    className="rounded-xl bg-gray-50 border-gray-200 text-gray-805 placeholder-gray-400 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/70 h-11 text-xs px-4"
                    maxLength={100}
                  />
                </div>

                {/* 3. Music Selector */}
                <div className="grid gap-2.5">
                  <Label className="font-bold text-gray-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Music size={13} className="text-orange-500" />
                    3. Nhạc nền câu chuyện (Phát thử khi chọn)
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[170px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {AVAILABLE_MUSICS.map((music) => (
                      <button
                        key={music.id}
                        type="button"
                        onClick={() => handleSelectMusic(music.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left text-[10px] font-black transition-all flex items-center justify-between group h-10 shadow-sm",
                          selectedMusicId === music.id
                            ? "border-orange-500 bg-orange-50/50 text-orange-600 shadow-sm"
                            : "border-gray-200 bg-slate-50/50 hover:bg-slate-50 text-gray-700 hover:border-gray-300",
                        )}
                      >
                        <span className="truncate max-w-[110px]">
                          {music.title}
                        </span>
                        {selectedMusicId === music.id &&
                          music.id !== "none" && (
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                          )}
                      </button>
                    ))}
                  </div>
                  {selectedMusicId !== "none" && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 italic font-medium">
                      <Sparkles
                        size={10}
                        className="text-orange-500 animate-spin"
                      />
                      Đang phát nhạc thử, âm thanh tự tắt khi đóng hoặc đăng
                      tin.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t border-gray-100 pt-4 mt-2">
              <Button
                type="button"
                onClick={() => setIsCreateStoryOpen(false)}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-extrabold border-none transition-all h-10 px-5 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createStoryMutation.isPending}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all h-10 px-6 text-xs"
              >
                {createStoryMutation.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Đăng tin ngay
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Filter Categories */}
        <div className="md:col-span-1 space-y-4 md:sticky md:top-[80px] self-start">
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
              <CardTitle className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                <Filter size={16} className="text-orange-500" />
                Lọc theo chủ đề
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((cat) => {
                  const catIcons: Record<string, React.ReactNode> = {
                    all: <MessageSquare size={16} />,
                    general: <MessageCircle size={16} />,
                    review: <Utensils size={16} />,
                    life: <Heart size={16} />,
                    knowledge: <BookOpen size={16} />,
                  };

                  const isSelected = selectedCategory === cat.value;

                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5",
                        isSelected
                          ? "bg-orange-50 text-orange-600 font-extrabold shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <span
                        className={cn(
                          "p-1.5 rounded-lg",
                          isSelected
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {catIcons[cat.value] || <MessageSquare size={16} />}
                      </span>
                      <span>{cat.label}</span>
                      {isSelected && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Search Card */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden p-4 space-y-3 bg-white">
            <h3 className="text-sm font-black text-gray-700 flex items-center gap-1.5">
              <Search size={16} className="text-orange-500" />
              Tìm kiếm bài viết
            </h3>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="rounded-xl border-gray-200"
            />
          </Card>

          {/* Friend Search Card */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden p-4 space-y-3 bg-white">
            <h3 className="text-sm font-black text-gray-700 flex items-center gap-1.5">
              <User size={16} className="text-orange-500" />
              Tìm kiếm đồng nghiệp
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="Tìm tên hoặc email..."
                className="pl-9 rounded-xl border-gray-200"
              />
            </div>

            {friendSearchLoading ? (
              <div className="flex items-center gap-2 justify-center py-3 text-xs text-gray-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tìm kiếm...
              </div>
            ) : friendUsersList.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2 pr-1 custom-scrollbar">
                {friendUsersList.map((u: any) => {
                  const isVip = u.hasMembership;
                  const isGold = isVip && u.vipCosmetics?.vipTheme === "gold";
                  return (
                    <Link
                      key={u._id || u.id}
                      to={getProfileLink(u._id || u.id)}
                      className="flex items-center gap-2.5 p-2 rounded-xl transition-all hover:bg-orange-50/50 border border-transparent hover:border-orange-100"
                    >
                      <VipAvatar
                        avatarUrl={u.avatar}
                        name={u.name}
                        hasMembership={u.hasMembership}
                        vipAvatarFrame={u.vipCosmetics?.vipAvatarFrame}
                        size="sm"
                      />
                      <div className="truncate min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p
                            className={cn(
                              "font-extrabold text-xs truncate leading-tight",
                              isVip
                                ? isGold
                                  ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-black"
                                  : "text-amber-500"
                                : "text-gray-800",
                            )}
                          >
                            {u.name}
                          </p>
                          {isVip && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5 scale-90">
                              👑 {u.membershipName || "VIP"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate leading-tight">
                          {u.email}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : friendSearchQuery ? (
              <p className="text-center py-2 text-[10px] text-gray-450 font-bold">
                Không tìm thấy đồng nghiệp nào
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 font-bold italic">
                Nhập tên để tìm kiếm nhanh đồng đạo...
              </p>
            )}
          </Card>
        </div>

        {/* Middle Column: Post Creator + Feed */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
          {/* Post Creator Card (Facebook Style) */}
          <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Link to={getProfileLink()} className="shrink-0">
                <VipAvatar
                  avatarUrl={user?.avatar}
                  name={user?.name}
                  hasMembership={user?.hasMembership}
                  vipAvatarFrame={user?.vipCosmetics?.vipAvatarFrame}
                  size="md"
                />
              </Link>
              <button
                onClick={() => {
                  setCategory("general");
                  setIsCreateOpen(true);
                }}
                className="flex-1 text-left px-4 py-3 rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-500 text-xs font-medium border border-gray-200/50 transition-colors focus:outline-none"
              >
                {user?.name
                  ? `${user.name} ơi, hôm nay bạn có chia sẻ gì không?`
                  : "Hôm nay bạn muốn chia sẻ gì thế?"}
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-around text-xs text-gray-500 font-bold">
              <button
                onClick={() => {
                  setCategory("general");
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-sky-600 transition-colors flex-1"
              >
                <MessageCircle size={16} />
                <span>Đăng bài</span>
              </button>
              <button
                onClick={() => {
                  setCategory("review");
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-emerald-600 transition-colors flex-1"
              >
                <Utensils size={16} />
                <span>Review món</span>
              </button>
              <button
                onClick={() => {
                  setCategory("knowledge");
                  setIsCreateOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-amber-500 transition-colors flex-1"
              >
                <BookOpen size={16} />
                <span>Kiến thức</span>
              </button>
            </div>
          </Card>

          {/* Feed */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200/60 rounded-2xl space-y-2 shadow-sm">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-medium">
                Đang tải luồng thảo luận...
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
              <div className="text-4xl mb-2">💬</div>
              <h3 className="font-bold text-lg text-gray-800">
                Chưa có bài viết nào
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Đạo hữu hãy là người đầu tiên khơi mào cuộc thảo luận nhé!
              </p>
            </div>
          ) : (
            filteredPosts.map((post: any) => {
              const myReaction = getMyReaction(post.reactions);
              const myReactionConfig = myReaction
                ? REACTION_TYPES.find((rt) => rt.value === myReaction.type)
                : null;
              const myReactionLabel = myReactionConfig
                ? myReactionConfig.label
                : "Thích";
              const myReactionColor = myReactionConfig
                ? myReactionConfig.color
                : "text-gray-650 hover:text-blue-500";
              const myReactionIcon = myReactionConfig ? (
                <span className="text-sm shrink-0 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                  {myReactionConfig.emoji}
                </span>
              ) : (
                <ThumbsUp
                  size={16}
                  className="text-gray-500 transition-transform group-hover:scale-110"
                />
              );

              const postCategory =
                CATEGORIES.find((c) => c.value === post.category)?.label ||
                "Tám chuyện";

              // VIP styling checks
              const isAuthorVip = post.userId?.hasMembership;
              const isVipGold =
                isAuthorVip && post.userId?.vipCosmetics?.vipTheme === "gold";

              return (
                <div
                  key={post._id}
                  onClick={() => setSelectedDetailPostId(post._id)}
                  className="border border-gray-200/80 hover:border-orange-250 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden shadow-sm cursor-pointer bg-white"
                >
                  <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-4 md:p-5 space-y-4">
                      {/* Author Header */}
                      <div
                        className="flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <UserHoverCardWrapper
                          userId={post.userId?._id || post.userId?.id}
                        >
                          <Link
                            to={getProfileLink(
                              post.userId?._id || post.userId?.id,
                            )}
                            className="shrink-0"
                          >
                            <VipAvatar
                              avatarUrl={post.userId?.avatar}
                              name={post.userId?.name}
                              hasMembership={post.userId?.hasMembership}
                              vipAvatarFrame={
                                post.userId?.vipCosmetics?.vipAvatarFrame
                              }
                              size="md"
                            />
                          </Link>
                        </UserHoverCardWrapper>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <UserHoverCardWrapper
                              userId={post.userId?._id || post.userId?.id}
                            >
                              <Link
                                to={getProfileLink(
                                  post.userId?._id || post.userId?.id,
                                )}
                                className="hover:underline"
                              >
                                <span
                                  className={cn(
                                    "text-sm font-black truncate leading-tight",
                                    isAuthorVip
                                      ? isVipGold
                                        ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                        : "text-amber-500"
                                      : "text-gray-900",
                                  )}
                                >
                                  {post.userId?.name || "Đạo hữu ẩn danh"}
                                </span>
                              </Link>
                            </UserHoverCardWrapper>
                            {isAuthorVip && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 scale-90">
                                <Award
                                  size={10}
                                  className="fill-amber-700/20"
                                />
                                {post.userId?.membershipName || "VIP Member"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {post.createdAt
                              ? formatDistanceToNow(new Date(post.createdAt), {
                                  addSuffix: true,
                                  locale: vi,
                                })
                              : "Vừa xong"}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-orange-50 text-orange-600 border-none font-bold text-xs rounded-xl px-2.5 py-1"
                        >
                          {postCategory}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h2 className="text-base font-extrabold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-1">
                          {post.title}
                        </h2>
                        <p className="text-xs md:text-sm text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-gray-100 max-h-[320px] mt-2 select-none">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover max-h-[320px] hover:scale-[1.01] transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      {/* Engagement statistics - Row 1 */}
                      <div
                        className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedDetailPostId(post._id);
                        }}
                      >
                        {renderReactionSummary(post)}
                        <div className="hover:underline font-bold text-gray-500 text-[10px]">
                          {post.commentsCount || 0} bình luận
                        </div>
                      </div>

                      {/* Footer Actions - Row 2 */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-gray-500 text-xs font-bold gap-1">
                        {/* Reactions button wrapper */}
                        <div
                          className="relative group/react-btn flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Floating Reaction Bar */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/react-btn:flex items-center gap-1.5 bg-white p-2 rounded-full shadow-lg border border-gray-100 animate-fade-in z-20 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-4">
                            {REACTION_TYPES.map((rt) => (
                              <button
                                key={rt.value}
                                onClick={(e) =>
                                  handleReactPost(e, post._id, rt.value)
                                }
                                className="text-xl transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                title={rt.label}
                              >
                                {rt.emoji}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={(e) =>
                              handleReactPost(
                                e,
                                post._id,
                                myReaction ? myReaction.type : "like",
                              )
                            }
                            className={cn(
                              "flex items-center justify-center gap-1.5 py-2 w-full rounded-xl transition-all hover:bg-gray-50",
                              myReaction ? "bg-gray-50/50" : "",
                            )}
                          >
                            {myReactionIcon}
                            <span className={cn(myReactionColor)}>
                              {myReactionLabel}
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedDetailPostId(post._id);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-gray-50 text-gray-600 hover:text-orange-500 flex-1"
                        >
                          <MessageSquare size={16} />
                          <span>Bình luận</span>
                        </button>

                        <button
                          onClick={(e) => handleShare(e, post._id)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-gray-50 text-gray-600 hover:text-orange-500 flex-1 text-center"
                        >
                          <Share2 size={16} />
                          <span>Chia sẻ</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Hot Topics & VIP Spotlights */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 lg:sticky lg:top-[80px] self-start">
          {/* Hot Topics */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
              <CardTitle className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-red-500" />
                Đang nổi bật 🔥
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {hotPosts.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">
                  Chưa có bài viết nào nổi bật.
                </p>
              ) : (
                hotPosts.map((hp: any, idx: number) => (
                  <button
                    key={hp._id}
                    onClick={() => setSelectedDetailPostId(hp._id)}
                    className="w-full text-left block group space-y-1.5 pb-3 border-b border-gray-50 last:border-none last:pb-0"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black text-orange-500 mt-0.5">
                        #{idx + 1}
                      </span>
                      <h4 className="text-xs font-black text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">
                        {hp.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pl-4">
                      <span>{hp.userId?.name || "Ẩn danh"}</span>
                      <span className="flex items-center gap-1 font-bold text-gray-500">
                        💬 {hp.commentsCount || 0} • ❤️ {hp.likes?.length || 0}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* VIP Spotlights Promotion Card */}
          <Card
            className={cn(
              "border shadow-sm rounded-2xl overflow-hidden",
              cardTheme.cardBg,
            )}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    cardTheme.iconBg,
                  )}
                >
                  <Crown size={16} className="animate-bounce" />
                </div>
                <h4
                  className={cn(
                    "text-xs font-black uppercase tracking-wide",
                    cardTheme.titleText,
                  )}
                >
                  Đặc quyền vinh danh VIP
                </h4>
              </div>
              <p
                className={cn(
                  "text-[11px] leading-relaxed font-medium",
                  cardTheme.descText,
                )}
              >
                Sở hữu thẻ hội viên VIP để bài viết của đạo hữu luôn nổi bật với
                khung viền lấp lánh và tên gradient độc quyền trên diễn đàn!
              </p>

              <ul className="space-y-1.5 text-[10px] font-bold">
                <li className="flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className={cn("animate-pulse", cardTheme.sparkleColor)}
                  />
                  <span className={cardTheme.descText}>
                    Khung Avatar VIP đặc chế
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className={cn("animate-pulse", cardTheme.sparkleColor)}
                  />
                  <span className={cardTheme.descText}>
                    Tên gradient Hoàng Kim lấp lánh
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className={cn("animate-pulse", cardTheme.sparkleColor)}
                  />
                  <span className={cardTheme.descText}>
                    Giảm ngay 2.000đ mỗi phần cơm
                  </span>
                </li>
              </ul>

              <Link to="/vip" className="block pt-2">
                <Button
                  className={cn(
                    "w-full text-xs font-black rounded-xl h-9 border-none shadow-sm",
                    cardTheme.buttonClass,
                  )}
                >
                  Khám phá Gói VIP →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Dynamic Mascot Inline Advisor */}
          <VipMascotInline />
        </div>
      </div>

      {/* Post Detail Modal (Facebook Style) */}
      <Dialog
        open={!!selectedDetailPostId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDetailPostId(null);
            setDetailCommentContent("");
            setReplyingCommentId(null);
            setReplyContent("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto rounded-2xl flex flex-col p-0 gap-0 custom-scrollbar bg-white">
          {detailLoading && !detailPost ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-2">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-sm text-gray-400 font-semibold">
                Đang tải bài viết...
              </p>
            </div>
          ) : detailPost ? (
            <>
              {/* Modal Header */}
              <div className="p-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <DialogTitle className="text-base font-black text-gray-950">
                  Bài viết của {detailPost.userId?.name || "Đạo hữu"}
                </DialogTitle>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <UserHoverCardWrapper
                    userId={detailPost.userId?._id || detailPost.userId?.id}
                  >
                    <Link
                      to={getProfileLink(
                        detailPost.userId?._id || detailPost.userId?.id,
                      )}
                      className="shrink-0"
                    >
                      <VipAvatar
                        avatarUrl={detailPost.userId?.avatar}
                        name={detailPost.userId?.name}
                        hasMembership={detailPost.userId?.hasMembership}
                        vipAvatarFrame={
                          detailPost.userId?.vipCosmetics?.vipAvatarFrame
                        }
                        size="md"
                      />
                    </Link>
                  </UserHoverCardWrapper>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <UserHoverCardWrapper
                        userId={detailPost.userId?._id || detailPost.userId?.id}
                      >
                        <Link
                          to={getProfileLink(
                            detailPost.userId?._id || detailPost.userId?.id,
                          )}
                          className="hover:underline"
                        >
                          <span
                            className={cn(
                              "text-sm font-black truncate leading-tight",
                              detailPost.userId?.hasMembership
                                ? detailPost.userId?.vipCosmetics?.vipTheme ===
                                  "gold"
                                  ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                  : "text-amber-500"
                                : "text-gray-900",
                            )}
                          >
                            {detailPost.userId?.name || "Đạo hữu ẩn danh"}
                          </span>
                        </Link>
                      </UserHoverCardWrapper>
                      {detailPost.userId?.hasMembership && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 scale-90">
                          👑 {detailPost.userId?.membershipName || "VIP"}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {detailPost.createdAt
                        ? formatDistanceToNow(new Date(detailPost.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })
                        : "Vừa xong"}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-orange-50 text-orange-600 border-none font-bold text-xs rounded-xl px-2.5 py-1"
                  >
                    {CATEGORIES.find((c) => c.value === detailPost.category)
                      ?.label || "Tám chuyện"}
                  </Badge>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h2 className="text-base md:text-lg font-black text-gray-900 leading-snug">
                    {detailPost.title}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-750 whitespace-pre-line leading-relaxed">
                    {detailPost.content}
                  </p>
                  {detailPost.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-100 mt-2 select-none">
                      <img
                        src={detailPost.imageUrl}
                        alt={detailPost.title}
                        className="w-full object-contain max-h-[400px] bg-black/5"
                      />
                    </div>
                  )}
                </div>

                {/* Likes/Comments statistics */}
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-55">
                  {renderReactionSummary(detailPost)}
                  <div className="font-bold text-gray-500 text-[10px]">
                    {detailComments.length} bình luận
                  </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between py-1 border-t border-b border-gray-100 text-gray-500 text-xs font-bold gap-1">
                  {/* Modal Post Reaction Button with Hover */}
                  <div className="relative group/modal-react flex-1">
                    {/* Floating Reaction Bar */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/modal-react:flex items-center gap-1.5 bg-white p-2 rounded-full shadow-lg border border-gray-100 animate-fade-in z-20 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-4">
                      {REACTION_TYPES.map((rt) => (
                        <button
                          key={rt.value}
                          onClick={(e) =>
                            handleReactPost(e, detailPost._id, rt.value)
                          }
                          className="text-xl transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                          title={rt.label}
                        >
                          {rt.emoji}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        const myReact = getMyReaction(detailPost.reactions);
                        handleReactPost(
                          e,
                          detailPost._id,
                          myReact ? myReact.type : "like",
                        );
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 w-full rounded-xl transition-all hover:bg-gray-50",
                        getMyReaction(detailPost.reactions)
                          ? "bg-gray-50/50"
                          : "",
                      )}
                    >
                      {getMyReaction(detailPost.reactions) ? (
                        <span className="text-sm shrink-0 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                          {
                            REACTION_TYPES.find(
                              (rt) =>
                                rt.value ===
                                getMyReaction(detailPost.reactions)?.type,
                            )?.emoji
                          }
                        </span>
                      ) : (
                        <ThumbsUp size={16} className="text-gray-500" />
                      )}
                      <span
                        className={cn(
                          getMyReaction(detailPost.reactions)
                            ? REACTION_TYPES.find(
                                (rt) =>
                                  rt.value ===
                                  getMyReaction(detailPost.reactions)?.type,
                              )?.color
                            : "text-gray-600",
                        )}
                      >
                        {getMyReaction(detailPost.reactions)
                          ? REACTION_TYPES.find(
                              (rt) =>
                                rt.value ===
                                getMyReaction(detailPost.reactions)?.type,
                            )?.label
                          : "Thích"}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleShare(e, detailPost._id)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:bg-gray-50 text-gray-600 hover:text-orange-500 flex-1"
                  >
                    <Share2 size={16} />
                    <span>Chia sẻ</span>
                  </button>
                </div>

                {/* Comments List Section */}
                <div className="space-y-4 pt-1">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    Bình luận ({detailComments.length})
                  </h3>

                  {/* Comment list scroll container */}
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {detailComments.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                        Chưa có bình luận nào. Hãy bắt đầu thảo luận!
                      </div>
                    ) : (
                      (() => {
                        // Filter parent comments vs replies
                        const parentComments = detailComments.filter(
                          (c: any) => !c.parentId,
                        );
                        const replyComments = detailComments.filter(
                          (c: any) => c.parentId,
                        );

                        return parentComments.map((parent: any) => {
                          const parentReaction = getMyReaction(
                            parent.reactions,
                          );
                          const parentReplies = replyComments.filter(
                            (r: any) =>
                              (r.parentId?._id || r.parentId) === parent._id,
                          );

                          return (
                            <div key={parent._id} className="space-y-3">
                              {/* Parent Comment */}
                              <div className="flex gap-2.5 items-start">
                                <UserHoverCardWrapper
                                  userId={
                                    parent.userId?._id || parent.userId?.id
                                  }
                                >
                                  <Link
                                    to={getProfileLink(
                                      parent.userId?._id || parent.userId?.id,
                                    )}
                                    className="flex-shrink-0"
                                  >
                                    <VipAvatar
                                      avatarUrl={parent.userId?.avatar}
                                      name={parent.userId?.name}
                                      hasMembership={
                                        parent.userId?.hasMembership
                                      }
                                      vipAvatarFrame={
                                        parent.userId?.vipCosmetics
                                          ?.vipAvatarFrame
                                      }
                                      size="sm"
                                    />
                                  </Link>
                                </UserHoverCardWrapper>
                                <div className="flex-1">
                                  <div className="relative inline-block max-w-[95%]">
                                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                        <UserHoverCardWrapper
                                          userId={
                                            parent.userId?._id ||
                                            parent.userId?.id
                                          }
                                        >
                                          <Link
                                            to={getProfileLink(
                                              parent.userId?._id ||
                                                parent.userId?.id,
                                            )}
                                            className="hover:underline"
                                          >
                                            <span
                                              className={cn(
                                                "text-xs font-black truncate leading-none",
                                                parent.userId?.hasMembership
                                                  ? parent.userId?.vipCosmetics
                                                      ?.vipTheme === "gold"
                                                    ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                                    : "text-amber-500"
                                                  : "text-gray-900",
                                              )}
                                            >
                                              {parent.userId?.name ||
                                                "Đạo hữu ẩn danh"}
                                            </span>
                                          </Link>
                                        </UserHoverCardWrapper>
                                        {parent.userId?.hasMembership && (
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0 rounded flex items-center gap-0.5 scale-90 leading-none">
                                            👑{" "}
                                            {parent.userId?.membershipName ||
                                              "VIP"}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                        {parent.content}
                                      </p>
                                    </div>

                                    {/* Parent Comment Reactions Indicator */}
                                    {parent.reactions &&
                                      parent.reactions.length > 0 && (
                                        <div className="absolute -bottom-2 right-2 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-0.5 text-[9px] font-bold text-gray-500 select-none z-10">
                                          <div className="flex -space-x-0.5">
                                            {Array.from(
                                              new Set(
                                                parent.reactions.map(
                                                  (r: any) => r.type,
                                                ),
                                              ),
                                            )
                                              .slice(0, 2)
                                              .map((type: any) => (
                                                <span key={type}>
                                                  {REACTION_TYPES.find(
                                                    (rt) => rt.value === type,
                                                  )?.emoji || "👍"}
                                                </span>
                                              ))}
                                          </div>
                                          <span>{parent.reactions.length}</span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Action links row */}
                                  <div className="flex items-center gap-3 pl-3 mt-1 text-[10px] text-gray-400 font-bold">
                                    <div className="relative group/comm-react">
                                      {/* Comment Reaction list */}
                                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover/comm-react:flex items-center gap-1.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 animate-fade-in z-25 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-3">
                                        {REACTION_TYPES.map((rt) => (
                                          <button
                                            key={rt.value}
                                            onClick={() =>
                                              handleReactComment(
                                                parent._id,
                                                rt.value,
                                              )
                                            }
                                            className="text-sm transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                          >
                                            {rt.emoji}
                                          </button>
                                        ))}
                                      </div>

                                      <button
                                        onClick={() =>
                                          handleReactComment(
                                            parent._id,
                                            parentReaction
                                              ? parentReaction.type
                                              : "like",
                                          )
                                        }
                                        className={cn(
                                          "hover:underline",
                                          parentReaction
                                            ? REACTION_TYPES.find(
                                                (rt) =>
                                                  rt.value ===
                                                  parentReaction.type,
                                              )?.color
                                            : "text-gray-500",
                                        )}
                                      >
                                        {parentReaction
                                          ? REACTION_TYPES.find(
                                              (rt) =>
                                                rt.value ===
                                                parentReaction.type,
                                            )?.label
                                          : "Thích"}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() =>
                                        setReplyingCommentId(
                                          replyingCommentId === parent._id
                                            ? null
                                            : parent._id,
                                        )
                                      }
                                      className="hover:underline text-gray-500"
                                    >
                                      Phản hồi
                                    </button>

                                    <span>
                                      {parent.createdAt
                                        ? formatDistanceToNow(
                                            new Date(parent.createdAt),
                                            {
                                              addSuffix: true,
                                              locale: vi,
                                            },
                                          )
                                        : "Vừa xong"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Nested Replies */}
                              {parentReplies.length > 0 && (
                                <div className="pl-10 space-y-3 border-l-2 border-gray-100 ml-4">
                                  {parentReplies.map((reply: any) => {
                                    const replyReaction = getMyReaction(
                                      reply.reactions,
                                    );

                                    return (
                                      <div
                                        key={reply._id}
                                        className="flex gap-2 items-start"
                                      >
                                        <UserHoverCardWrapper
                                          userId={
                                            reply.userId?._id ||
                                            reply.userId?.id
                                          }
                                        >
                                          <Link
                                            to={getProfileLink(
                                              reply.userId?._id ||
                                                reply.userId?.id,
                                            )}
                                            className="flex-shrink-0"
                                          >
                                            <VipAvatar
                                              avatarUrl={reply.userId?.avatar}
                                              name={reply.userId?.name}
                                              hasMembership={
                                                reply.userId?.hasMembership
                                              }
                                              vipAvatarFrame={
                                                reply.userId?.vipCosmetics
                                                  ?.vipAvatarFrame
                                              }
                                              size="sm"
                                              className="w-7 h-7"
                                            />
                                          </Link>
                                        </UserHoverCardWrapper>
                                        <div className="flex-1">
                                          <div className="relative inline-block max-w-[95%]">
                                            <div className="bg-gray-100 rounded-2xl px-3.5 py-1.5">
                                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <UserHoverCardWrapper
                                                  userId={
                                                    reply.userId?._id ||
                                                    reply.userId?.id
                                                  }
                                                >
                                                  <Link
                                                    to={getProfileLink(
                                                      reply.userId?._id ||
                                                        reply.userId?.id,
                                                    )}
                                                    className="hover:underline"
                                                  >
                                                    <span
                                                      className={cn(
                                                        "text-[11px] font-black truncate leading-none",
                                                        reply.userId
                                                          ?.hasMembership
                                                          ? reply.userId
                                                              ?.vipCosmetics
                                                              ?.vipTheme ===
                                                            "gold"
                                                            ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                                                            : "text-amber-500"
                                                          : "text-gray-900",
                                                      )}
                                                    >
                                                      {reply.userId?.name ||
                                                        "Đạo hữu ẩn danh"}
                                                    </span>
                                                  </Link>
                                                </UserHoverCardWrapper>
                                                {reply.userId
                                                  ?.hasMembership && (
                                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[8px] px-1 py-0 rounded flex items-center gap-0.5 scale-90 leading-none">
                                                    👑{" "}
                                                    {reply.userId
                                                      ?.membershipName || "VIP"}
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-xs text-gray-705 leading-relaxed whitespace-pre-line">
                                                {reply.content}
                                              </p>
                                            </div>

                                            {/* Reply Reaction counts */}
                                            {reply.reactions &&
                                              reply.reactions.length > 0 && (
                                                <div className="absolute -bottom-2 right-2 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-0.5 text-[9px] font-bold text-gray-505 select-none z-10">
                                                  <div className="flex -space-x-0.5">
                                                    {Array.from(
                                                      new Set(
                                                        reply.reactions.map(
                                                          (r: any) => r.type,
                                                        ),
                                                      ),
                                                    )
                                                      .slice(0, 2)
                                                      .map((type: any) => (
                                                        <span key={type}>
                                                          {REACTION_TYPES.find(
                                                            (rt) =>
                                                              rt.value === type,
                                                          )?.emoji || "👍"}
                                                        </span>
                                                      ))}
                                                  </div>
                                                  <span>
                                                    {reply.reactions.length}
                                                  </span>
                                                </div>
                                              )}
                                          </div>

                                          <div className="flex items-center gap-3 pl-3 mt-1 text-[10px] text-gray-400 font-bold">
                                            <div className="relative group/reply-react">
                                              {/* Reply Reaction list */}
                                              <div className="absolute bottom-full left-0 mb-1 hidden group-hover/reply-react:flex items-center gap-1.5 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 animate-fade-in z-25 after:absolute after:content-[''] after:top-full after:left-0 after:right-0 after:h-3">
                                                {REACTION_TYPES.map((rt) => (
                                                  <button
                                                    key={rt.value}
                                                    onClick={() =>
                                                      handleReactComment(
                                                        reply._id,
                                                        rt.value,
                                                      )
                                                    }
                                                    className="text-xs transition-transform hover:scale-130 duration-150 active:scale-95 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                                  >
                                                    {rt.emoji}
                                                  </button>
                                                ))}
                                              </div>

                                              <button
                                                onClick={() =>
                                                  handleReactComment(
                                                    reply._id,
                                                    replyReaction
                                                      ? replyReaction.type
                                                      : "like",
                                                  )
                                                }
                                                className={cn(
                                                  "hover:underline",
                                                  replyReaction
                                                    ? REACTION_TYPES.find(
                                                        (rt) =>
                                                          rt.value ===
                                                          replyReaction.type,
                                                      )?.color
                                                    : "text-gray-500",
                                                )}
                                              >
                                                {replyReaction
                                                  ? REACTION_TYPES.find(
                                                      (rt) =>
                                                        rt.value ===
                                                        replyReaction.type,
                                                    )?.label
                                                  : "Thích"}
                                              </button>
                                            </div>

                                            <span>
                                              {reply.createdAt
                                                ? formatDistanceToNow(
                                                    new Date(reply.createdAt),
                                                    {
                                                      addSuffix: true,
                                                      locale: vi,
                                                    },
                                                  )
                                                : "Vừa xong"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Reply Input Field */}
                              {replyingCommentId === parent._id && (
                                <div className="pl-10 ml-4 pt-1">
                                  <form
                                    onSubmit={(e) =>
                                      handleReplySubmit(e, parent._id)
                                    }
                                    className="flex gap-2 items-center"
                                  >
                                    <Link
                                      to={getProfileLink()}
                                      className="flex-shrink-0 hover:opacity-90 transition-opacity"
                                    >
                                      <VipAvatar
                                        avatarUrl={user?.avatar}
                                        name={user?.name}
                                        hasMembership={user?.hasMembership}
                                        vipAvatarFrame={
                                          user?.vipCosmetics?.vipAvatarFrame
                                        }
                                        size="sm"
                                        className="w-7 h-7"
                                      />
                                    </Link>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) =>
                                          setReplyContent(e.target.value)
                                        }
                                        placeholder={`Trả lời ${parent.userId?.name || "đạo hữu"}...`}
                                        className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                      />
                                    </div>
                                    <Button
                                      type="submit"
                                      disabled={createCommentMutation.isPending}
                                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-8 w-8 p-0 flex items-center justify-center shadow-md shadow-orange-100 flex-shrink-0"
                                    >
                                      <Send size={12} />
                                    </Button>
                                  </form>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Comment Input Form Footer (Parent comment only) */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!detailCommentContent.trim()) {
                      toast({
                        variant: "destructive",
                        title: "Thiếu nội dung",
                        description: "Vui lòng nhập nội dung bình luận.",
                      });
                      return;
                    }
                    createCommentMutation.mutate({
                      postId: detailPost._id,
                      content: detailCommentContent.trim(),
                    });
                  }}
                  className="flex gap-2.5 items-end"
                >
                  <Link
                    to={getProfileLink()}
                    className="flex-shrink-0 hover:opacity-90 transition-opacity"
                  >
                    <VipAvatar
                      avatarUrl={user?.avatar}
                      name={user?.name}
                      hasMembership={user?.hasMembership}
                      vipAvatarFrame={user?.vipCosmetics?.vipAvatarFrame}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1">
                    <textarea
                      value={detailCommentContent}
                      onChange={(e) => setDetailCommentContent(e.target.value)}
                      placeholder="Viết bình luận của bạn..."
                      rows={1}
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none max-h-[80px]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createCommentMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-9 w-9 p-0 flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0"
                  >
                    <Send size={14} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Không tìm thấy bài viết.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DANH SÁCH NGƯỜI THẢ CẢM XÚC */}
      <Dialog open={isReactionListOpen} onOpenChange={setIsReactionListOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl flex flex-col">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-3xl shrink-0">
            <DialogTitle className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-white">
              <span>💖</span>
              Người đã bày tỏ cảm xúc
            </DialogTitle>
            <DialogDescription className="text-xs text-orange-100 font-medium">
              Danh sách chi tiết đồng nghiệp đã thả cảm xúc bài viết
            </DialogDescription>
          </DialogHeader>

          {/* Custom Tabs list */}
          {(() => {
            const reactions = activeReactionPost?.reactions || [];

            // Count unique reaction types
            const counts: Record<string, number> = {};
            reactions.forEach((r: any) => {
              counts[r.type] = (counts[r.type] || 0) + 1;
            });

            // Get available reaction types with counts > 0
            const activeReactionTypes = REACTION_TYPES.filter(
              (rt) => counts[rt.value] > 0,
            ).map((rt) => ({
              ...rt,
              count: counts[rt.value],
            }));

            // Filtered list based on active tab
            const filteredReactions = reactions.filter(
              (r: any) =>
                activeReactionTab === "all" || r.type === activeReactionTab,
            );

            return (
              <>
                {/* Tabs bar */}
                <div className="flex border-b border-gray-100 overflow-x-auto shrink-0 bg-gray-50/50 p-2 gap-1.5 scrollbar-thin">
                  <button
                    onClick={() => setActiveReactionTab("all")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                      activeReactionTab === "all"
                        ? "bg-white text-orange-600 shadow-sm border border-orange-100"
                        : "text-gray-500 hover:bg-gray-100",
                    )}
                  >
                    <span>Tất cả</span>
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 bg-gray-100 text-gray-700 text-[10px] font-bold border-none"
                    >
                      {reactions.length}
                    </Badge>
                  </button>

                  {activeReactionTypes.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setActiveReactionTab(rt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                        activeReactionTab === rt.value
                          ? "bg-white text-orange-600 shadow-sm border border-orange-100"
                          : "text-gray-500 hover:bg-gray-100",
                      )}
                    >
                      <span className="text-sm">{rt.emoji}</span>
                      <span>{rt.label}</span>
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 bg-gray-100 text-gray-700 text-[10px] font-bold border-none"
                      >
                        {rt.count}
                      </Badge>
                    </button>
                  ))}
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[350px]">
                  {filteredReactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <p className="text-sm font-bold">Chưa có cảm xúc nào</p>
                    </div>
                  ) : (
                    filteredReactions.map((r: any, idx: number) => {
                      const reactor = r.userId;
                      if (!reactor) return null;

                      const isVip = reactor.hasMembership;
                      const isVipGold =
                        isVip && reactor.vipCosmetics?.vipTheme === "gold";
                      const emoji =
                        REACTION_TYPES.find((rt) => rt.value === r.type)
                          ?.emoji || "👍";

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 hover:bg-orange-50/20 rounded-2xl transition-all border border-transparent hover:border-orange-100/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <VipAvatar
                                avatarUrl={reactor.avatar}
                                name={reactor.name}
                                hasMembership={isVip}
                                vipAvatarFrame={
                                  reactor.vipCosmetics?.vipAvatarFrame
                                }
                                size="sm"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm text-sm border border-gray-100 select-none">
                                {emoji}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4
                                  className={cn(
                                    "font-extrabold text-xs truncate max-w-[160px]",
                                    isVip
                                      ? isVipGold
                                        ? "bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-600 bg-clip-text text-transparent font-black"
                                        : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent font-black"
                                      : "text-gray-900",
                                  )}
                                >
                                  {reactor.name}
                                </h4>
                                {isVip && (
                                  <span className="text-[8px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded font-black uppercase shrink-0 border border-amber-100 leading-none">
                                    👑 {reactor.membershipName || "VIP"}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">
                                {reactor.email}
                              </p>
                            </div>
                          </div>

                          <div>
                            <Link to={`/user/${reactor._id || reactor.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-xl text-[10px] font-bold text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                              >
                                Xem hồ sơ
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function UserHoverCardWrapper({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
      setIsOpen(true);
    }, 400);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      setIsOpen(false);
    }, 200);
    setTimer(t);
  };

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isOpen && coords && (
        <UserHoverCardPortal
          userId={userId}
          coords={coords}
          onMouseEnter={() => {
            if (timer) clearTimeout(timer);
          }}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
}

function UserHoverCardPortal({
  userId,
  coords,
  onMouseEnter,
  onMouseLeave,
}: {
  userId: string;
  coords: { top: number; left: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["hoverProfile", userId],
    queryFn: () => socialApi.getPublicProfile(userId),
    staleTime: 30000,
  });

  const profile = profileResponse?.data?.data;

  const content = (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        top: `${coords.top - 8}px`,
        left: `${coords.left}px`,
        transform: "translateY(-100%)",
      }}
      className="z-[9999] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in pointer-events-auto"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-28">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      ) : profile ? (
        (() => {
          const targetUser = profile.user;
          const isVip = targetUser?.hasMembership;
          const isVipGold =
            isVip && targetUser?.vipCosmetics?.vipTheme === "gold";
          const coverBg =
            targetUser?.vipCosmetics?.vipTheme === "gold"
              ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"
              : targetUser?.vipCosmetics?.vipTheme === "sakura"
                ? "bg-gradient-to-r from-pink-400 to-rose-300"
                : "bg-gradient-to-r from-orange-400 to-red-500";

          return (
            <>
              <div className={cn("h-16 w-full relative", coverBg)}>
                {isVip && (
                  <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20">
                    👑 {targetUser?.membershipName || "VIP"}
                  </div>
                )}
              </div>

              <div className="px-4 pb-4 relative">
                <div className="absolute -top-8 left-4">
                  <VipAvatar
                    avatarUrl={targetUser?.avatar}
                    name={targetUser?.name}
                    hasMembership={targetUser?.hasMembership}
                    vipAvatarFrame={targetUser?.vipCosmetics?.vipAvatarFrame}
                    size="md"
                    className="border-2 border-white shadow-md w-14 h-14"
                  />
                </div>

                <div className="pt-8 space-y-2">
                  <div>
                    <h4
                      className={cn(
                        "font-black text-sm truncate",
                        isVipGold
                          ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                          : isVip
                            ? "text-amber-500"
                            : "text-gray-900",
                      )}
                    >
                      {targetUser?.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">
                      {targetUser?.email}
                    </p>
                  </div>

                  <div className="flex gap-4 text-[11px] text-gray-550 font-bold border-t border-b border-gray-50 py-1.5">
                    <div>
                      <span className="text-gray-800">
                        {profile.friendsCount}
                      </span>{" "}
                      Bạn bè
                    </div>
                    <div>
                      <span className="text-gray-800">
                        {profile.followersCount}
                      </span>{" "}
                      Người theo dõi
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      to={
                        targetUser?._id || targetUser?.id
                          ? `/user/${targetUser._id || targetUser.id}`
                          : "#"
                      }
                    >
                      <Button
                        size="sm"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs h-8"
                      >
                        Xem trang cá nhân
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          );
        })()
      ) : null}
    </div>
  );

  return createPortal(content, document.body);
}
