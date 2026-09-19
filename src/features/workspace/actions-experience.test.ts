import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({
  role:"OWNER", updateUser:vi.fn(), updateGroup:vi.fn(), cookieSet:vi.fn(),
  membership:vi.fn(), createItem:vi.fn(), archiveItem:vi.fn(),
}));
vi.mock("next/headers",()=>({headers:async()=>new Headers(),cookies:async()=>({get:()=>({value:"de"}),set:mocks.cookieSet})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error(`REDIRECT:${path}`);}}));
vi.mock("@/lib/auth",()=>({auth:{api:{getSession:async()=>({user:{id:"me",name:"Anna",email:"anna@example.com"}}),updateUser:mocks.updateUser}}}));
vi.mock("@/lib/db",()=>({db:{group:{update:mocks.updateGroup},membership:{findUnique:mocks.membership}}}));
vi.mock("@/features/groups/group-service",()=>({getPrimaryMembership:async()=>({groupId:"my-group",role:mocks.role,group:{id:"my-group",name:"My group"}}),createGroupForUser:vi.fn()}));
vi.mock("@/features/items/item-service",()=>({createItem:mocks.createItem,archiveItem:mocks.archiveItem,updateItem:vi.fn()}));
vi.mock("@/features/invitations/invitation-service",()=>({createInvitation:vi.fn()}));
vi.mock("@/features/reservations/reservation-service",()=>({approveReservation:vi.fn(),cancelReservation:vi.fn(),createReservation:vi.fn(),transitionReservation:vi.fn()}));
import * as originalActions from "@/app/(app)/app/actions";
const actions=originalActions as unknown as Record<string,(data:FormData)=>Promise<{error?:string;success?:string}>>;
function form(values:Record<string,string>){const data=new FormData();Object.entries(values).forEach(([key,value])=>data.set(key,value));return data;}
beforeEach(()=>{vi.clearAllMocks();mocks.role="OWNER";mocks.createItem.mockResolvedValue({});});
describe("safe and usable workspace actions",()=>{
  it("rejects invalid item data without redirects or losing the form",async()=>{
    mocks.createItem.mockRejectedValueOnce(new Error("NOT_AVAILABLE"));
    const result=await actions.createItemAction(form({name:"Table",totalQuantity:"1"}));
    expect(result.error).toBeTruthy();
  });
  it("rejects unknown item operations instead of silently succeeding",async()=>{
    const result=await actions.itemAction(form({itemId:"item",action:"destroy"}));
    expect(result?.error).toBeTruthy();expect(mocks.archiveItem).not.toHaveBeenCalled();
  });
  it("saves a validated profile through the signed-in auth session",async()=>{
    expect(actions.updateProfileAction).toBeTypeOf("function");
    const result=await actions.updateProfileAction(form({name:"  Anna Test  ",userId:"someone-else"}));
    expect(result.error).toBeUndefined();expect(mocks.updateUser).toHaveBeenCalledWith(expect.objectContaining({body:{name:"Anna Test"}}));
  });
  it("does not save a blank profile",async()=>{
    expect(actions.updateProfileAction).toBeTypeOf("function");
    const result=await actions.updateProfileAction(form({name:" "}));
    expect(result.error).toBeTruthy();expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("rejects group edits by ordinary members",async()=>{
    mocks.role="MEMBER";expect(actions.updateGroupAction).toBeTypeOf("function");
    const result=await actions.updateGroupAction(form({name:"New group"}));
    expect(result.error).toBeTruthy();expect(mocks.updateGroup).not.toHaveBeenCalled();
  });
  it("only edits the authenticated owner's own active group",async()=>{
    expect(actions.updateGroupAction).toBeTypeOf("function");
    await actions.updateGroupAction(form({name:"New group",groupId:"someone-else"}));
    expect(mocks.updateGroup).toHaveBeenCalledWith({where:{id:"my-group"},data:{name:"New group"}});
  });
  it("rejects unsupported language preferences",async()=>{
    expect(actions.setLanguageAction).toBeTypeOf("function");
    const result=await actions.setLanguageAction(form({locale:"invalid"}));
    expect(result.error).toBeTruthy();expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});
