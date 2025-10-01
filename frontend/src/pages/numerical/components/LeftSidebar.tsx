import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SignedIn } from "@clerk/clerk-react";
import { History, HomeIcon, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const LeftSidebar = () => {
  return (
    <div className="h-full flex flex-col gap-2 ">
      {/* Menu */}
      <div className="rounded-lg p-4 bg-zinc-900 border-2">
        <div className="space-y-2">
          <Link
            to={"/"}
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-white hover:bg-zinc-800",
              })
            )}
          >
            <HomeIcon className="mr-2 size-5" />
            <span className="hidden lg:inline">Home</span>
          </Link>
          <SignedIn>
            <Link
              to={"/history"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className:
                    "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}
            >
              <History className="mr-2 size-5" />
              <span className="hidden md:inline">History</span>
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Library */}
      <div className="flex-1 rounded-lg bg-zinc-900 p-4 border-2">
        <div className="w-full flex items-center justify-between text-white px-2 py-2 rounded-md border-2 hover:bg-zinc-800">
          <span className="hidden lg:inline">New Chats</span>
          <Plus className="ml-2 size-5 cursor-pointer hover:text-white transition-colors" />
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="w-full flex items-center justify-between text-white px-2 py-2 rounded-md">
            <span className="hidden lg:inline">Recent Chats</span>
            <Trash2 className="ml-2 size-5 cursor-pointer hover:text-red-500 transition-colors" />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default LeftSidebar;
