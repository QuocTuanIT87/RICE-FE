import { useState, useEffect, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { useSocket } from "@/contexts/SocketContext";
import { chatApi, usersApi, socialApi } from "@/services/api";
import { Message, User } from "@/types";
import { useToast } from "@/hooks/useToast";
import VipAvatar from "@/components/VipAvatar";
import {
  Send,
  Image as ImageIcon,
  Smile,
  Trash2,
  Search,
  ArrowLeft,
  X,
  User as UserIcon,
  Sparkles,
  Loader2,
  CornerDownRight,
  Home,
  UserPlus,
  UserCheck,
  UserMinus,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";

// Danh sách các emoji cảm xúc
const EMOJI_MAP = {
  like: "👍",
  love: "❤️",
  haha: "😆",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

// Hàm tổng hợp âm thanh "ting" thông báo (dùng Web Audio API tự thân)
const playTingSound = () => {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Âm rê cao D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // Âm la cao A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("Không thể phát âm thanh thông báo:", e);
  }
};

const parseStoryReply = (content: string) => {
  if (!content) return null;
  if (content.startsWith('{"isStoryReply":true')) {
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getMessageTextContent = (content: string) => {
  if (!content) return "";
  const parsed = parseStoryReply(content);
  if (parsed) {
    return `[Phản hồi Tin]: "${parsed.text}"`;
  }
  return content;
};

export default function ChatPage() {
  const { user } = useAppSelector((state) => state.auth);
  const myId = user?.id || user?._id || "";

  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerIdParam =
    searchParams.get("partnerId") || searchParams.get("userId");
  const processedParamRef = useRef<string | null>(null);

  // State quản lý cuộc hội thoại đang mở
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePartnerUser, setActivePartnerUser] = useState<User | null>(null);

  // Trạng thái biệt danh (nickname) lưu ở localStorage
  const [nicknames, setNicknames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("chat_nicknames");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Tải danh sách người dùng bị chặn từ backend
  const { data: blockedListResponse } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: () =>
      socialApi.getBlockedList().then((res) => res.data.data || []),
    enabled: !!myId,
  });

  const blockedUsers = useMemo(() => {
    const list = blockedListResponse || [];
    return new Set<string>(
      list.map((u) => u._id || u.id).filter(Boolean) as string[],
    );
  }, [blockedListResponse]);

  // Mutation Chặn người dùng
  const blockUserMutation = useMutation({
    mutationFn: (targetId: string) => socialApi.blockUser(targetId),
    onSuccess: (res, targetId) => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["publicProfile", targetId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Đã chặn",
        description: res.data.message || "Đã chặn tin nhắn từ đạo hữu này.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi chặn người dùng",
        description: err.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  // Mutation Mở chặn người dùng
  const unblockUserMutation = useMutation({
    mutationFn: (targetId: string) => socialApi.unblockUser(targetId),
    onSuccess: (res, targetId) => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["publicProfile", targetId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Mở chặn",
        description: res.data.message || "Đã mở chặn đạo hữu này.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi mở chặn",
        description: err.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sự kiện click ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isBlockedByMe = activePartnerId
    ? blockedUsers.has(activePartnerId)
    : false;

  const toggleBlockUser = (targetId: string) => {
    if (blockedUsers.has(targetId)) {
      unblockUserMutation.mutate(targetId);
    } else {
      blockUserMutation.mutate(targetId);
    }
  };

  const handleSetNickname = () => {
    if (!activePartnerId || !activePartnerUser) return;
    const currentNickname = nicknames[activePartnerId] || "";
    Swal.fire({
      title: "ĐẶT BIỆT DANH",
      html: `
        <div class="text-xs font-semibold text-slate-500 mb-3">Đặt biệt danh cho đạo hữu <strong>${activePartnerUser.name}</strong>:</div>
        <input id="swal-nickname-input" class="w-full py-2.5 px-4 rounded-xl border border-gray-250 bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm mb-2 font-sans text-gray-800 text-center" placeholder="Nhập biệt danh..." value="${currentNickname}">
      `,
      showCancelButton: true,
      confirmButtonText: "XÁC NHẬN",
      cancelButtonText: "HỦY",
      customClass: {
        popup:
          "rounded-3xl border border-gray-100 bg-white font-sans text-gray-900 shadow-2xl p-6 max-w-[416px] overflow-hidden",
        title:
          "text-base font-black text-slate-800 uppercase tracking-wide mb-1",
        confirmButton:
          "px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white rounded-xl font-bold text-[13px] shadow-sm uppercase tracking-wider transition-all focus:outline-none active:scale-95 mr-2",
        cancelButton:
          "px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[13px] transition-all focus:outline-none active:scale-95",
      },
      buttonsStyling: false,
      preConfirm: () => {
        const input = document.getElementById(
          "swal-nickname-input",
        ) as HTMLInputElement;
        return input ? input.value : "";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const name = result.value;
        if (name !== null) {
          const cleanName = name.trim();
          setNicknames((prev) => {
            const next = { ...prev };
            if (cleanName) {
              next[activePartnerId] = cleanName;
            } else {
              delete next[activePartnerId];
            }
            localStorage.setItem("chat_nicknames", JSON.stringify(next));
            return next;
          });
          toast({
            title: "Biệt danh",
            description: cleanName
              ? `Đã đặt biệt danh mới là "${cleanName}"`
              : "Đã xóa biệt danh.",
          });
        }
      }
    });
  };

  // State tin nhắn & soạn thảo
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // State online status & typing
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showEmojiPickerForMsgId, setShowEmojiPickerForMsgId] = useState<
    string | null
  >(null);

  // State tìm kiếm người dùng mới
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  // Ref cuộn xuống tin nhắn mới nhất
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải danh sách các cuộc hội thoại gần đây
  const { data: conversationsData, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ["conversations"],
      queryFn: async () => {
        const res = await chatApi.getConversations();
        return res.data.data || [];
      },
      refetchInterval: 15000, // Tự động làm mới mỗi 15s đề phòng mất kết nối
    });

  const conversations = conversationsData || [];

  // Tải thông tin hồ sơ của đối tác để lấy trạng thái bạn bè
  const { data: partnerProfileResponse } = useQuery({
    queryKey: ["publicProfile", activePartnerId],
    queryFn: () => socialApi.getPublicProfile(activePartnerId || ""),
    enabled: !!activePartnerId,
  });

  const partnerProfile = partnerProfileResponse?.data?.data;
  const isBlockedByThem = partnerProfile?.isBlockedByThem || false;
  const friendStatus = partnerProfile?.friendStatus || "none";

  // Các mutations xử lý hành động bạn bè
  const sendFriendRequestMutation = useMutation({
    mutationFn: () => socialApi.sendFriendRequest(activePartnerId || ""),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["publicProfile", activePartnerId],
      });
      toast({
        title: "Kết bạn",
        description: res.data.message || "Đã gửi yêu cầu kết bạn!",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi kết bạn",
        description: err.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: () => socialApi.acceptFriendRequest(activePartnerId || ""),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["publicProfile", activePartnerId],
      });
      toast({
        title: "Kết bạn",
        description: res.data.message || "Đã đồng ý kết bạn!",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi đồng ý kết bạn",
        description: err.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const cancelFriendRequestMutation = useMutation({
    mutationFn: () => socialApi.declineFriendRequest(activePartnerId || ""),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["publicProfile", activePartnerId],
      });
      toast({
        title: "Hủy lời mời",
        description: res.data.message || "Đã hủy lời mời kết bạn!",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi hủy lời mời",
        description: err.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  // Tự động mở cuộc hội thoại từ URL query parameter (?partnerId=... hoặc ?userId=...)
  useEffect(() => {
    if (!partnerIdParam) return;
    if (isLoadingConversations) return;
    if (processedParamRef.current === partnerIdParam) return;

    // Đánh dấu đã xử lý để tránh gọi lại nhiều lần
    processedParamRef.current = partnerIdParam;

    // Tìm trong danh sách hội thoại hiện có
    const foundConv = Array.isArray(conversations)
      ? conversations.find(
          (c) =>
            c.otherUser?._id === partnerIdParam ||
            c.otherUser?.id === partnerIdParam,
        )
      : undefined;

    if (foundConv && foundConv.otherUser) {
      setActivePartnerId(partnerIdParam);
      setActivePartnerUser(foundConv.otherUser);
    } else {
      // Nếu chưa có, tải thông tin người dùng từ backend
      const fetchNewPartner = async () => {
        try {
          const res = await usersApi.getUserById(partnerIdParam);
          const newUser = res.data?.data?.user;
          if (newUser) {
            setActivePartnerId(partnerIdParam);
            setActivePartnerUser(newUser);
          }
        } catch (err) {
          console.error(
            "Lỗi lấy thông tin người dùng từ query parameter:",
            err,
          );
        }
      };
      fetchNewPartner();
    }

    // Xóa query parameter khỏi URL để tránh kích hoạt lại khi có tin nhắn mới hoặc re-render
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("partnerId");
    newParams.delete("userId");
    setSearchParams(newParams, { replace: true });
  }, [
    partnerIdParam,
    conversations,
    isLoadingConversations,
    searchParams,
    setSearchParams,
  ]);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc đổi partner
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // 2. Tải lịch sử tin nhắn khi đổi người nhắn tin
  useEffect(() => {
    if (!activePartnerId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await chatApi.getMessages(activePartnerId);
        setMessages(res.data.data || []);
        // Invalidate để cập nhật unreadCount ở sidebar
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch (err) {
        console.error("Lỗi lấy lịch sử tin nhắn:", err);
      }
    };

    fetchMessages();
    setIsPartnerTyping(false);
  }, [activePartnerId, queryClient]);

  // 3. Quản lý trạng thái đang soạn tin (typing indicator)
  useEffect(() => {
    if (!socket || !activePartnerId) return;

    if (inputText.trim() === "") {
      socket.emit("chat_typing", {
        senderId: myId,
        receiverId: activePartnerId,
        isTyping: false,
      });
      return;
    }

    // Báo đang soạn tin nhắn
    socket.emit("chat_typing", {
      senderId: myId,
      receiverId: activePartnerId,
      isTyping: true,
    });

    const delayDebounceFn = setTimeout(() => {
      socket.emit("chat_typing", {
        senderId: myId,
        receiverId: activePartnerId,
        isTyping: false,
      });
    }, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [inputText, activePartnerId, socket, myId]);

  const blockedUsersRef = useRef<Set<string>>(blockedUsers);
  useEffect(() => {
    blockedUsersRef.current = blockedUsers;
  }, [blockedUsers]);

  // 4. Lắng nghe các sự kiện socket thời gian thực
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      // Nếu gửi từ người dùng đang bị chặn, bỏ qua không xử lý
      if (blockedUsersRef.current.has(msg.senderId)) {
        return;
      }

      const isFromActivePartner =
        msg.senderId === activePartnerId || msg.receiverId === activePartnerId;

      if (isFromActivePartner) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Nếu mình là người nhận và đang mở cuộc trò chuyện, tự động gọi API getMessages để đánh dấu đã đọc
        if (msg.receiverId === myId) {
          chatApi.getMessages(activePartnerId!);
        }
      } else {
        // Tin nhắn từ người khác: phát âm thanh và hiển thị thông báo góc màn hình
        if (msg.senderId !== myId) {
          playTingSound();
          toast({
            title: "Tin nhắn mới 💬",
            description: msg.content
              ? getMessageTextContent(msg.content).length > 30
                ? getMessageTextContent(msg.content).substring(0, 30) + "..."
                : getMessageTextContent(msg.content)
              : "Đã gửi một hình ảnh",
            duration: 4000,
          });
        }
      }

      // Làm mới danh sách hội thoại để cập nhật tin nhắn cuối cùng và badge chưa đọc
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleMessageRecalled = (data: {
      messageId: string;
      updatedMessage: Message;
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? data.updatedMessage : msg,
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleMessageReacted = (data: {
      messageId: string;
      reactions: any[];
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg,
        ),
      );
    };

    const handlePresenceStatus = (data: {
      userId: string;
      status: "online" | "offline";
      lastActive: string;
    }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === "online") {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleActiveUsersList = (list: string[]) => {
      setOnlineUsers(new Set(list));
    };

    const handleTyping = (data: {
      senderId: string;
      receiverId: string;
      isTyping: boolean;
    }) => {
      if (data.senderId === activePartnerId) {
        setIsPartnerTyping(data.isTyping);
      }
    };

    socket.on("chat_message", handleNewMessage);
    socket.on("chat_message_recalled", handleMessageRecalled);
    socket.on("chat_message_reacted", handleMessageReacted);
    socket.on("presence_status", handlePresenceStatus);
    socket.on("active_users_list", handleActiveUsersList);
    socket.on("chat_typing", handleTyping);

    // Kéo danh sách những người đang online từ socket server
    socket.emit("get_active_users");

    return () => {
      socket.off("chat_message", handleNewMessage);
      socket.off("chat_message_recalled", handleMessageRecalled);
      socket.off("chat_message_reacted", handleMessageReacted);
      socket.off("presence_status", handlePresenceStatus);
      socket.off("active_users_list", handleActiveUsersList);
      socket.off("chat_typing", handleTyping);
    };
  }, [socket, activePartnerId, queryClient, myId, toast]);

  // 5. Tìm kiếm bạn bè để chat
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const cleanDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await usersApi.searchUsers({
          search: searchQuery,
          limit: 8,
        });
        const docs = res.data.data?.docs || [];
        // Lọc bỏ tài khoản của chính mình khỏi danh sách tìm thấy
        const filtered = docs.filter(
          (u: User) => u._id !== myId && u.id !== myId,
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error("Lỗi tìm kiếm user:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(cleanDebounce);
    };
  }, [searchQuery, myId]);

  // 6. Xử lý tải ảnh lên xem trước
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File quá dung lượng",
          description: "Vui lòng chọn hình ảnh dưới 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  // 7. Gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartnerId) return;
    if (!inputText.trim() && !selectedImage) return;

    const formData = new FormData();
    formData.append("receiverId", activePartnerId);
    if (inputText.trim()) {
      formData.append("content", inputText.trim());
    }
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    // Xóa ngay dữ liệu đầu vào trên giao diện để tránh gửi đúp
    setInputText("");
    removeSelectedImage();

    try {
      await chatApi.sendMessage(formData);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      toast({
        title: "Gửi tin nhắn thất bại",
        description: "Có lỗi xảy ra khi gửi tin nhắn, vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  // 8. Thu hồi tin nhắn
  const handleRecallMessage = async (messageId: string) => {
    try {
      await chatApi.recallMessage(messageId);
    } catch (err) {
      toast({
        title: "Không thể thu hồi tin nhắn",
        description: "Vui lòng kiểm tra lại kết nối mạng.",
        variant: "destructive",
      });
    }
  };

  // 9. Bày tỏ cảm xúc tin nhắn
  const handleReactMessage = async (
    messageId: string,
    reactionType: "like" | "love" | "haha" | "wow" | "sad" | "angry",
  ) => {
    setShowEmojiPickerForMsgId(null);
    try {
      await chatApi.reactMessage(messageId, reactionType);
    } catch (err) {
      toast({
        title: "Lỗi bày tỏ cảm xúc",
        description: "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  // 10. Bắt đầu chat với user mới từ tìm kiếm
  const startNewChat = (partnerUser: User) => {
    setActivePartnerId(partnerUser._id || partnerUser.id);
    setActivePartnerUser(partnerUser);
    setSearchQuery("");
    setSearchResults([]);
    processedParamRef.current = null;
  };

  // Kiểm tra vai trò VIP của đối tác chat hiện tại
  const isActivePartnerVip = activePartnerUser?.hasMembership;
  const activePartnerVipTheme =
    activePartnerUser?.vipCosmetics?.vipTheme || "default";

  return (
    <div className="flex h-[calc(100vh-180px)] max-w-6xl mx-auto w-full rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl relative">
      {/* SIDEBAR TRÁI - DANH SÁCH CUỘC HỘI THOẠI & TÌM KIẾM */}
      <div className="w-full md:w-80 flex flex-col border-r border-gray-150 shrink-0 bg-white/30">
        {/* Phần đầu: Ô tìm kiếm */}
        <div className="p-4 border-b border-gray-150">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span>Messengo Zola</span>
              <Sparkles size={16} className="text-amber-500 animate-pulse" />
            </h2>
            {(activePartnerId || searchQuery) && (
              <button
                onClick={() => {
                  setActivePartnerId(null);
                  setActivePartnerUser(null);
                  setSearchQuery("");
                  processedParamRef.current = null;
                }}
                className="p-1.5 hover:bg-orange-50 text-orange-500 hover:text-orange-600 rounded-xl transition-all"
                title="Quay lại màn hình chính"
              >
                <Home size={18} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đồng nghiệp..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-250 bg-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách kết quả tìm kiếm */}
        {searchQuery.trim() !== "" ? (
          <div className="flex-1 overflow-y-auto p-2 bg-white/40 space-y-1">
            <p className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase tracking-wider">
              Kết quả tìm kiếm
            </p>
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((searchUser) => {
                const isOnline = onlineUsers.has(
                  searchUser._id || searchUser.id,
                );
                const isVipUser = searchUser.hasMembership;
                const isVipGold =
                  isVipUser && searchUser.vipCosmetics?.vipTheme === "gold";

                return (
                  <button
                    key={searchUser._id || searchUser.id}
                    onClick={() => startNewChat(searchUser)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <VipAvatar
                        avatarUrl={searchUser.avatar}
                        name={searchUser.name}
                        hasMembership={searchUser.hasMembership}
                        vipAvatarFrame={searchUser.vipCosmetics?.vipAvatarFrame}
                        size="md"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "text-sm font-bold truncate",
                            isVipGold
                              ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                              : isVipUser
                                ? "text-amber-500"
                                : "text-gray-900",
                          )}
                        >
                          {nicknames[searchUser._id || searchUser.id] ||
                            searchUser.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 block truncate">
                        {searchUser.email}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Không tìm thấy ai phù hợp 🧐
              </div>
            )}
          </div>
        ) : (
          /* Danh sách hội thoại bình thường */
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConversations ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="text-xs text-gray-400">
                  Đang tải messengo...
                </span>
              </div>
            ) : Array.isArray(conversations) && conversations.length > 0 ? (
              conversations.map((conv) => {
                const partner = conv.otherUser;
                if (!partner) return null;

                const partnerId = partner._id || partner.id;
                const isSelected = activePartnerId === partnerId;
                const isOnline = onlineUsers.has(partnerId);

                const isVipUser = partner.hasMembership;
                const isVipGold =
                  isVipUser && partner.vipCosmetics?.vipTheme === "gold";

                const isBlockedPartner = blockedUsers.has(partnerId);
                const isMyLastMsg = conv.lastMessage?.senderId === myId;
                const lastMsgText = isBlockedPartner
                  ? "Đã chặn tin nhắn từ đạo hữu này"
                  : conv.lastMessage?.isRecalled
                    ? "Tin nhắn đã bị thu hồi"
                    : conv.lastMessage?.imageUrl
                      ? `${isMyLastMsg ? "Bạn: " : ""}Đã gửi một ảnh`
                      : `${isMyLastMsg ? "Bạn: " : ""}${getMessageTextContent(conv.lastMessage?.content)}`;

                return (
                  <button
                    key={partnerId}
                    onClick={() => {
                      setActivePartnerId(partnerId);
                      setActivePartnerUser(partner);
                      processedParamRef.current = null;
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative text-left",
                      isSelected
                        ? "bg-orange-500/10 border border-orange-500/20 shadow-sm"
                        : "hover:bg-white/50 border border-transparent",
                    )}
                  >
                    {/* Avatar kèm presence status dot */}
                    <div className="relative shrink-0">
                      <VipAvatar
                        avatarUrl={partner.avatar}
                        name={partner.name}
                        hasMembership={partner.hasMembership}
                        vipAvatarFrame={partner.vipCosmetics?.vipAvatarFrame}
                        size="md"
                      />
                      {isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-400 border-2 border-white rounded-full shadow-sm" />
                      )}
                    </div>

                    {/* Nội dung tóm tắt tin nhắn */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span
                          className={cn(
                            "text-sm font-bold truncate leading-snug",
                            isVipGold
                              ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent"
                              : isVipUser
                                ? "text-amber-500"
                                : "text-gray-800",
                          )}
                        >
                          {nicknames[partnerId] || partner.name}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-gray-400 ml-1 whitespace-nowrap">
                            {formatDistanceToNow(
                              new Date(conv.lastMessage.createdAt),
                              {
                                addSuffix: false,
                                locale: vi,
                              },
                            )}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs truncate mt-0.5",
                          conv.unreadCount > 0 && !isSelected
                            ? "text-gray-900 font-extrabold"
                            : "text-gray-400",
                          conv.lastMessage?.isRecalled && "italic",
                        )}
                      >
                        {lastMsgText || "Bắt đầu cuộc trò chuyện..."}
                      </p>
                    </div>

                    {/* Huy hiệu tin nhắn chưa đọc (Unread Count badge) */}
                    {conv.unreadCount > 0 &&
                      !isSelected &&
                      !isBlockedPartner && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-5 h-5 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full px-1 shadow-sm shadow-red-200 animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-16 text-gray-400 text-sm px-4">
                Chưa có hội thoại nào. Tìm kiếm đồng nghiệp bên trên để bắt đầu!
                🚀
              </div>
            )}
          </div>
        )}
      </div>

      {/* KHUNG HIỂN THỊ TRÒ CHUYỆN (GIỮA / PHẢI) */}
      <div className="flex-1 flex flex-col bg-white/20 min-w-0">
        {activePartnerId && activePartnerUser ? (
          <>
            {/* TIÊU ĐỀ KHUNG CHAT (CHAT HEADER) */}
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-white/60 backdrop-blur-md relative z-20">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => {
                    setActivePartnerId(null);
                    setActivePartnerUser(null);
                    processedParamRef.current = null;
                  }}
                  className="md:hidden text-gray-500 hover:text-gray-800 p-1"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="relative shrink-0">
                  <VipAvatar
                    avatarUrl={activePartnerUser.avatar}
                    name={activePartnerUser.name}
                    hasMembership={activePartnerUser.hasMembership}
                    vipAvatarFrame={
                      activePartnerUser.vipCosmetics?.vipAvatarFrame
                    }
                    size="md"
                  />
                  {onlineUsers.has(activePartnerId) ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 leading-snug">
                    <span
                      className={cn(
                        activePartnerUser.hasMembership &&
                          activePartnerUser.vipCosmetics?.vipTheme === "gold"
                          ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent"
                          : activePartnerUser.hasMembership
                            ? "text-amber-500"
                            : "",
                      )}
                    >
                      {nicknames[activePartnerId] || activePartnerUser.name}
                    </span>
                    {activePartnerUser.hasMembership && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded scale-90">
                        VIP
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    {onlineUsers.has(activePartnerId) ? (
                      <span className="text-green-500 font-bold">
                        Đang hoạt động
                      </span>
                    ) : (
                      <span>Ngoại tuyến</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action tools: Bạn bè & Trang cá nhân */}
              <div className="flex items-center gap-2">
                {friendStatus === "none" && (
                  <button
                    onClick={() => sendFriendRequestMutation.mutate()}
                    disabled={sendFriendRequestMutation.isPending}
                    className="h-9 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold gap-1 transition-all flex items-center active:scale-95 shadow-sm"
                  >
                    <UserPlus size={13} />
                    <span>Thêm bạn bè</span>
                  </button>
                )}
                {friendStatus === "pending_sent" && (
                  <button
                    onClick={() => cancelFriendRequestMutation.mutate()}
                    disabled={cancelFriendRequestMutation.isPending}
                    className="h-9 px-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 disabled:bg-gray-300 text-gray-500 rounded-xl text-xs font-bold gap-1 transition-all flex items-center active:scale-95 border border-gray-200"
                    title="Bấm để hủy yêu cầu"
                  >
                    <UserMinus size={13} />
                    <span>Đã gửi yêu cầu</span>
                  </button>
                )}
                {friendStatus === "pending_received" && (
                  <button
                    onClick={() => acceptFriendRequestMutation.mutate()}
                    disabled={acceptFriendRequestMutation.isPending}
                    className="h-9 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold gap-1 transition-all flex items-center active:scale-95 shadow-sm"
                  >
                    <UserCheck size={13} />
                    <span>Đồng ý kết bạn</span>
                  </button>
                )}

                {/* Dropdown Menu 3 chấm dọc */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                    className="p-2 hover:bg-orange-50 text-gray-500 hover:text-orange-500 rounded-xl transition-all"
                    title="Tùy chọn cuộc trò chuyện"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {showActionsDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl z-30 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <Link
                        to={`/user/${activePartnerId}`}
                        onClick={() => setShowActionsDropdown(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-2 text-xs font-bold"
                      >
                        <UserIcon size={14} className="text-gray-400" />
                        <span>Trang cá nhân</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowActionsDropdown(false);
                          handleSetNickname();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-gray-700 hover:text-orange-650 transition-colors flex items-center gap-2 text-xs font-bold"
                      >
                        <Smile size={14} className="text-gray-400" />
                        <span>Đặt biệt danh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowActionsDropdown(false);
                          toggleBlockUser(activePartnerId);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors flex items-center gap-2 text-xs font-bold border-t border-gray-50 mt-1 pt-2",
                          isBlockedByMe
                            ? "text-green-600 hover:text-green-700"
                            : "text-red-650 hover:text-red-700",
                        )}
                      >
                        <X
                          size={14}
                          className={
                            isBlockedByMe ? "text-green-400" : "text-red-400"
                          }
                        />
                        <span>
                          {isBlockedByMe ? "Mở chặn đạo hữu" : "Chặn đạo hữu"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VÙNG HIỂN THỊ TIN NHẮN (MESSAGE WRAPPER) */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gray-50/30"
            >
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isMine = msg.senderId === myId;
                  const isRecalled = msg.isRecalled;
                  const messageId = msg._id;

                  // Tính toán theme bong bóng chat theo gói VIP của sender
                  let bubbleClass = "";

                  if (isMine) {
                    // Bong bóng chat của mình
                    const myTheme = user?.vipCosmetics?.vipTheme;
                    if (user?.hasMembership && myTheme === "gold") {
                      bubbleClass =
                        "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-white border border-amber-300 shadow-md shadow-amber-100";
                    } else if (user?.hasMembership && myTheme === "sakura") {
                      bubbleClass =
                        "bg-gradient-to-r from-pink-400 via-rose-300 to-rose-500 text-white border border-pink-300 shadow-md shadow-pink-100";
                    } else {
                      bubbleClass =
                        "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-100";
                    }
                  } else {
                    // Bong bóng chat của đối phương
                    if (
                      isActivePartnerVip &&
                      activePartnerVipTheme === "gold"
                    ) {
                      bubbleClass =
                        "bg-amber-50 text-amber-950 border border-amber-150 shadow-sm";
                    } else if (
                      isActivePartnerVip &&
                      activePartnerVipTheme === "sakura"
                    ) {
                      bubbleClass =
                        "bg-pink-50/70 text-rose-950 border border-pink-150 shadow-sm";
                    } else {
                      bubbleClass =
                        "bg-white text-gray-800 border border-gray-150 shadow-sm";
                    }
                  }

                  // Group reactions
                  const reactionsCount: Record<string, number> = {};
                  msg.reactions?.forEach((r) => {
                    reactionsCount[r.type] = (reactionsCount[r.type] || 0) + 1;
                  });

                  return (
                    <div
                      key={messageId}
                      className={cn(
                        "flex items-end gap-2 group relative",
                        isMine ? "justify-end" : "justify-start",
                      )}
                    >
                      {/* Avatar của đối phương khi họ gửi */}
                      {!isMine && (
                        <div className="shrink-0 mb-1">
                          <VipAvatar
                            avatarUrl={activePartnerUser.avatar}
                            name={activePartnerUser.name}
                            hasMembership={activePartnerUser.hasMembership}
                            vipAvatarFrame={
                              activePartnerUser.vipCosmetics?.vipAvatarFrame
                            }
                            size="sm"
                          />
                        </div>
                      )}

                      {/* Khối tin nhắn */}
                      <div
                        className={cn(
                          "max-w-[70%] flex flex-col gap-1.5",
                          isMine ? "items-end" : "items-start",
                        )}
                      >
                        {/* Khung Story Preview đứng độc lập ở trên bong bóng chat */}
                        {!isRecalled && parseStoryReply(msg.content) && (
                          (() => {
                            const storyReply = parseStoryReply(msg.content);
                            if (!storyReply) return null;
                            return (
                              <Link
                                to={`/forum?storyId=${storyReply.storyId}&groupUserId=${storyReply.groupUserId || storyReply.userId}`}
                                className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-slate-50 hover:bg-slate-100 transition-all w-28 shadow-sm group/story text-left"
                                title="Bấm để xem story trên diễn đàn"
                              >
                                <div className="relative aspect-[9/16] w-full max-h-[145px] overflow-hidden bg-slate-950 flex items-center justify-center">
                                  <img
                                    src={storyReply.imageUrl}
                                    alt="Story"
                                    className="w-full h-full object-cover transition-transform group-hover/story:scale-105 duration-300"
                                  />
                                  {storyReply.caption && (
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 text-center">
                                      <p className="text-[8px] text-white font-extrabold line-clamp-1 leading-none">
                                        {storyReply.caption}
                                      </p>
                                    </div>
                                  )}
                                  <div className="absolute top-1.5 left-1.5 bg-black/60 text-[6px] text-white/95 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 backdrop-blur-[1px] border border-white/5 shadow-sm">
                                    <Sparkles size={5} className="text-orange-400 animate-pulse" />
                                    Story
                                  </div>
                                </div>
                              </Link>
                            );
                          })()
                        )}

                        <div className="flex items-center gap-1.5 relative">
                          {/* Menu thao tác nhanh cho tin nhắn của mình (Thu hồi) */}
                          {isMine && !isRecalled && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pr-1">
                              <button
                                onClick={() => handleRecallMessage(messageId)}
                                title="Thu hồi tin nhắn"
                                className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          {/* Bộ cảm xúc (Emoji Reactions Picker) - Hover/click trigger */}
                          {!isRecalled && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
                              <button
                                onClick={() =>
                                  setShowEmojiPickerForMsgId(
                                    showEmojiPickerForMsgId === messageId
                                      ? null
                                      : messageId,
                                  )
                                }
                                title="Thêm cảm xúc"
                                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                              >
                                <Smile size={13} />
                              </button>

                              {showEmojiPickerForMsgId === messageId && (
                                <div
                                  className={cn(
                                    "absolute bottom-7 bg-white border border-gray-150 rounded-full px-2 py-1 shadow-xl flex gap-1.5 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150",
                                    isMine ? "right-0" : "left-0",
                                  )}
                                >
                                  {Object.entries(EMOJI_MAP).map(
                                    ([type, emoji]) => (
                                      <button
                                        key={type}
                                        onClick={() =>
                                          handleReactMessage(
                                            messageId,
                                            type as any,
                                          )
                                        }
                                        className="hover:scale-130 active:scale-95 transition-transform text-base"
                                      >
                                        {emoji}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bong bóng tin nhắn */}
                          <div
                            className={cn(
                              "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed relative",
                              isRecalled
                                ? "bg-gray-100/50 text-gray-400 italic border border-gray-200"
                                : bubbleClass,
                              isMine ? "rounded-br-sm" : "rounded-bl-sm",
                            )}
                          >
                            {isRecalled ? (
                              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Trash2 size={12} className="opacity-60" />
                                {msg.content}
                              </span>
                            ) : (() => {
                              const storyReply = parseStoryReply(msg.content);
                              if (storyReply) {
                                return <span>{storyReply.text}</span>;
                              }
                              return (
                                <>
                                  {/* Ảnh đính kèm (nếu có) */}
                                  {msg.imageUrl && (
                                    <div className="mb-1.5 max-w-sm rounded-xl overflow-hidden shadow-sm">
                                      <img
                                        src={msg.imageUrl}
                                        alt="Ảnh đính kèm"
                                        className="w-full max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                        onClick={() =>
                                          window.open(msg.imageUrl, "_blank")
                                        }
                                      />
                                    </div>
                                  )}
                                  <span>{msg.content}</span>
                                </>
                              );
                            })()}

                            {/* Hiển thị danh sách cảm xúc (Reactions) ở góc dưới bong bóng chat */}
                            {!isRecalled &&
                              Object.keys(reactionsCount).length > 0 && (
                                <div
                                  className={cn(
                                    "absolute -bottom-2 bg-white/90 backdrop-blur-sm border border-gray-150 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm text-[10px] font-bold z-10 text-gray-700",
                                    isMine ? "right-2" : "left-2",
                                  )}
                                >
                                  <span className="flex">
                                    {Object.keys(reactionsCount).map((type) => (
                                      <span key={type}>
                                        {
                                          EMOJI_MAP[
                                            type as keyof typeof EMOJI_MAP
                                          ]
                                        }
                                      </span>
                                    ))}
                                  </span>
                                  {msg.reactions.length > 1 && (
                                    <span className="ml-0.5 text-gray-500">
                                      {msg.reactions.length}
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Menu thao tác nhanh cho đối tác (Reaction icon) */}
                          {!isMine && !isRecalled && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-1">
                              {/* Có thể thêm nút forward hoặc lưu nếu cần */}
                            </div>
                          )}
                        </div>

                        {/* Thời gian gửi tin nhắn dạng tooltip nhỏ phía dưới tin nhắn khi hover */}
                        <span className="text-[9px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {format(new Date(msg.createdAt), "HH:mm, dd/MM")}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="text-4xl mb-2">👋</div>
                  <h4 className="font-bold text-gray-600">
                    Hai người chưa có tin nhắn nào
                  </h4>
                  <p className="text-xs text-gray-400">
                    Gửi lời chào để bắt đầu cuộc trò chuyện!
                  </p>
                </div>
              )}

              {/* Typing indicator bong bóng động */}
              {isPartnerTyping && (
                <div className="flex items-end gap-2">
                  <div className="shrink-0 mb-1">
                    <VipAvatar
                      avatarUrl={activePartnerUser.avatar}
                      name={activePartnerUser.name}
                      hasMembership={activePartnerUser.hasMembership}
                      vipAvatarFrame={
                        activePartnerUser.vipCosmetics?.vipAvatarFrame
                      }
                      size="sm"
                    />
                  </div>
                  <div className="bg-white/80 border border-gray-150 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 max-w-[200px] shadow-sm">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      Đang soạn tin...
                    </span>
                  </div>
                </div>
              )}

              <div className="h-px" />
            </div>

            {/* KHUNG SOẠN THẢO VÀ GỬI TIN NHẮN (CHAT INPUT FORM) */}
            {isBlockedByMe ? (
              <div className="p-4 border-t border-gray-150 bg-red-50/40 backdrop-blur-md flex items-center justify-between gap-4 py-6">
                <span className="text-xs font-bold text-red-600 flex items-center gap-1.5 pl-2">
                  🚫 Bạn đã chặn tin nhắn từ đạo hữu này.
                </span>
                <button
                  type="button"
                  onClick={() => toggleBlockUser(activePartnerId)}
                  className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Mở chặn
                </button>
              </div>
            ) : isBlockedByThem ? (
              <div className="p-4 border-t border-gray-150 bg-red-50/40 backdrop-blur-md flex items-center justify-between gap-4 py-6">
                <span className="text-xs font-bold text-red-650 flex items-center gap-1.5 pl-2">
                  🚫 Đạo hữu này đã chặn tin nhắn từ bạn.
                </span>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-150 bg-white/60 backdrop-blur-md flex flex-col gap-2">
                {/* Xem trước ảnh đính kèm đang chọn */}
                {imagePreviewUrl && (
                  <div className="relative inline-block self-start border border-gray-200 rounded-xl overflow-hidden shadow-md bg-gray-100 max-w-[120px]">
                    <img
                      src={imagePreviewUrl}
                      alt="Upload preview"
                      className="w-24 h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  {/* Chọn ảnh */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded-xl transition-colors shrink-0"
                    title="Gửi hình ảnh"
                  >
                    <ImageIcon size={18} />
                  </button>

                  {/* Nhập text */}
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-250 bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  {/* Nút gửi */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !selectedImage}
                    className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          /* TRẠNG THÁI RỖNG CHƯA CHỌN CUỘC TRÒ CHUYỆN (EMPTY STATE) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/20">
            <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-md shadow-orange-100 animate-bounce">
              💬
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center gap-1.5 justify-center">
              <span>Messengo Zola</span>
              <Sparkles size={16} className="text-orange-500" />
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mb-6">
              Bắt đầu đàm đạo với các đạo hữu để cùng nhau chọn món ăn ngon,
              trao đổi kiến thức tu tiên hoặc chém gió mọi nẻo đường!
            </p>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/50 rounded-full px-3 py-1.5 flex items-center gap-1">
                <CornerDownRight size={12} />
                Hãy chọn đạo hữu bên thanh trái để bắt đầu nhắn tin
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
