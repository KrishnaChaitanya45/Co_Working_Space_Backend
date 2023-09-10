const { Response } = require("express");

require("dotenv").config();
const User = require("../../models/userModal.ts");
const Server = require("../../models/serverModal.ts");
const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const createServer = async (req: any, res: Response) => {
  const { serverName, serverDescription, serverProfilePhoto } = req.body;
  const userID = req.user;
  try {
    if (!serverName)
      return res.status(400).json({ message: "Server name is required" });
    const foundUser = await User.findById(userID);
    if (!foundUser) return res.status(400).json({ message: "User not found" });
    const AdminRoleId = Math.floor(Math.random() * 1000) + 9000;
    const newServer = new Server({
      serverName,
      serverDescription,
      serverProfilePhoto: serverProfilePhoto
        ? serverProfilePhoto
        : "https://res.cloudinary.com/deardiary/image/upload/v1693221898/DearDiary/Habits/Login_mxzaj8.png",
    });
    newServer.users.push({
      user: userID,
      roleId: {
        Admin: AdminRoleId,
      },
    });
    await newServer.save();
    const serverInfo = {
      server: newServer._id,
      role: {
        id: {
          Admin: AdminRoleId,
        },
      },
    };
    foundUser.servers.push(serverInfo);

    await foundUser.save();
    return res
      .status(200)
      .json({ message: "Server created successfully", server: newServer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const addToServer = async (req: any, res: Response) => {
  const { userId } = req.body;
  const { serverId } = req.params;
  const adminId = req.user;
  try {
    const foundUser = await User.findById(adminId);
    if (!foundUser)
      return res.status(400).json({ message: "Request User not found" });
    const foundServer = await Server.findById(serverId);
    if (!foundServer)
      return res.status(400).json({ message: "Server not found" });

    const isAdmin = foundServer.users.find(
      (u: {
        user: any;
        roleId: {
          Admin: number;
        };
      }) => {
        if (u.user.toString() === adminId && u.roleId.Admin > 9000) {
          return true;
        }
      }
    );
    console.log("== IS ADMIN ==", isAdmin);
    const isManager = foundServer.users.find(
      (u: {
        user: any;
        roleId: {
          Manager: number;
        };
      }) => {
        if (u.user.toString() === adminId.toString() && u.roleId.Manager) {
          return true;
        }
      }
    );
    console.log("== IS MANAGER ==", isManager);
    if (Boolean(isAdmin) && Boolean(isManager))
      return res.status(400).json({
        message: "You don't have the access to add users to this server",
      });
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });
    const userAlreadyExists = foundServer.users.find(
      (u: {
        user: any;
        roleId: {
          Admin: number;
          Manager: number;
        };
      }) => u.user.toString() == userId
    );
    if (userAlreadyExists)
      return res.status(400).json({ message: "User already exists" });
    const roleId = Math.floor(Math.random() * 1000) + 6000;

    foundServer.users.push({
      user: userId,
      roleId: {
        User: roleId,
      },
    });
    await foundServer.save();
    const serverInfo = {
      server: serverId,
      role: {
        id: {
          User: roleId,
        },
      },
    };
    user.servers.push(serverInfo);
    await user.save();
    return res
      .status(200)
      .json({ message: "User added to server successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllServersOfUser = async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(400)
        .json({ message: "User id not added with the request" });
    }
    const foundUser = await User.find({ _id: user })
      .populate("servers")
      .populate({
        path: "servers",
        populate: {
          path: "server",
          model: "Server",
        },
      });

    if (!foundUser) {
      return res.status(400).json({ message: "User not found" });
    }

    if (foundUser[0].servers.length === 0) {
      return res.status(200).json({ message: "No servers found" });
    }
    return res.status(200).json({ servers: foundUser[0].servers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getServer = async (req: any, res: Response) => {
  try {
    const { serverId } = req.params;
    const foundServer = await Server.findById(serverId)
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
    if (!foundServer) {
      return res.status(400).json({ message: "Server not found" });
    }
    return res.status(200).json({ server: foundServer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateServer = async (req: any, res: Response) => {
  try {
    const { serverId } = req.params;
    const { serverName, serverDescription } = req.body;
    const foundServer = await Server.findById(serverId);
    if (!foundServer) {
      return res.status(400).json({ message: "Server not found" });
    }
    const user = req.user;
    if (
      foundServer.admin.toString() !== user ||
      foundServer.managers.find((m: string) => m.toString() !== user)
    ) {
      return res
        .status(400)
        .json({ message: "You are not authorized to update this server" });
    }
    foundServer.serverName = serverName;
    foundServer.serverDescription = serverDescription;
    await foundServer.save();
    return res
      .status(200)
      .json({ message: "Server updated successfully", server: foundServer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteServer = async (req: any, res: Response) => {
  try {
    const { serverId } = req.params;
    const foundServer = await Server.findById(serverId);
    if (!foundServer) {
      return res.status(400).json({ message: "Server not found" });
    }
    const user = req.user;
    if (foundServer.admin.toString() !== user) {
      return res
        .status(400)
        .json({ message: "You are not authorized to delete this server" });
    }
    await Server.findByIdAndDelete(serverId);
    const admin = await User.findById(user);
    admin.servers = admin.servers.filter(
      (s: { server: string; role: any }) => s.server.toString() !== serverId
    );
    await admin.save();
    return res.status(200).json({ message: "Server deleted successfully" });
  } catch (error) {}
};

const getAllServers = async (req: any, res: Response) => {
  try {
    const { name } = req.query;
    console.log(name);
    const servers = await Server.find(
      name ? { serverName: { $regex: name } } : {}
    )
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });

    if (servers.length === 0) {
      return res.status(404).json({ message: "No servers found" });
    }
    return res.status(200).json({ servers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const promoteOrDemoteUser = async (req: any, res: Response) => {
  try {
    const { serverId } = req.params;
    const { role, userId } = req.body;
    const foundServer = await Server.findById(serverId);

    if (!foundServer) {
      return res.status(400).json({ message: "Server not found" });
    }
    const userToPromoteOrDemote = await User.find({ _id: userId })
      .populate("servers")
      .populate({
        path: "servers",
        populate: {
          path: "server",
          model: "Server",
        },
      });

    console.log(userToPromoteOrDemote[0]);
    if (!userToPromoteOrDemote[0]) {
      return res.status(400).json({ message: "User not found in database" });
    }
    const userExists =
      foundServer.users.length > 0 &&
      Boolean(
        foundServer.users.find(
          (u: { user: string }) => u.user.toString() === userId
        )
      );

    if (!userExists) {
      return res.status(400).json({ message: "User not found in server" });
    }

    const promoteOrDemoteUser_Role = userToPromoteOrDemote[0].servers.find(
      (s: { server: any }) => s.server._id.toString() === serverId
    ).role.id;
    let ourUser = await User.find({ _id: req.user })
      .populate("servers")
      .populate({
        path: "servers",
        populate: {
          path: "server",
          model: "Server",
        },
      });
    ourUser = ourUser[0];
    if (userToPromoteOrDemote[0]._id.toString() === ourUser._id.toString()) {
      return res
        .status(400)
        .json({ message: "You can't promote or demote yourself" });
    }
    const ourUser_Role = ourUser.servers.find(
      (s: { server: any }) => s.server._id.toString() === serverId
    ).role.id;

    // ! BUSINESS LOGIC
    // ? Admins can assign Managers and Leads
    // ? Managers can assign Leads
    // ? Leads can't assign anyone
    // ? Admins can assign others as Admin and demote themselves to Manager
    // ? Managers can't assign other Managers
    // ? Leads can't assign other Leads
    // ? One admin is required for a server
    const promoteOrDemoteUser_Role_Number: any = Object.values(
      promoteOrDemoteUser_Role
    )[0];
    const ourUser_Role_Number: any = Object.values(ourUser_Role)[0];
    if (ourUser_Role_Number < promoteOrDemoteUser_Role_Number) {
      return res
        .status(400)
        .json({ message: "You can't promote or demote this user" });
    }
    console.log(role, Object.keys(role));
    if (
      ourUser_Role_Number > 8000 &&
      (Object.keys(ourUser_Role)[0] == "Manager" ||
        Object.keys(ourUser_Role)[0] == "Admin")
    ) {
      // @ts-ignore
      if (Object.keys(role)[0] == "Lead" && Object.values(role)[0] > 7000) {
        if (
          foundServer.users.find(
            (u: { user: string }) => u.user.toString() === userId
          ).roleId.Lead > 7000
        ) {
          return res.status(400).json({ message: "User is already a lead" });
        }
        if (
          foundServer.users.filter(
            (u: { roleId: { Lead: number } }) => u.roleId.Lead > 7000
          ).length == 4
        ) {
          return res.status(400).json({ message: "Only 4 leads are allowed" });
        }
        const LeadId = Math.floor(Math.random() * 1000) + 7000;
        userToPromoteOrDemote[0].servers.find(
          (s: any) => s.server._id.toString() === serverId
        ).role.id = { Lead: LeadId };
        await User.findByIdAndUpdate(userToPromoteOrDemote[0]._id, {
          $set: {
            servers: userToPromoteOrDemote[0].servers,
          },
        });
        foundServer.users.find(
          (u: any) =>
            u.user.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId.Lead = LeadId;

        await foundServer.save();
        return res.status(200).json({
          title: "User Promoted To Lead ✅",
          message: "User promoted to Lead Successfully ",
        });
      }
      // @ts-ignore
      if (Object.keys(role)[0] == "User" && Object.values(role)[0] < 7000) {
        if (
          foundServer.users.find((u: any) => u.user.toString() === userId)
            .roleId.User > 6000
        ) {
          return res.status(400).json({ message: "User is already a User" });
        }
        const UserId = Math.floor(Math.random() * 1000) + 6000;
        userToPromoteOrDemote[0].servers.find(
          (s: any) => s.server._id.toString() === serverId
        ).role.id = { User: UserId };
        await User.findByIdAndUpdate(userToPromoteOrDemote[0]._id, {
          $set: {
            servers: userToPromoteOrDemote[0].servers,
          },
        });
        foundServer.users.find(
          (u: any) =>
            u.user.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId.User = UserId;

        await foundServer.save();
        return res.status(200).json({
          title: "User Demoted To User ✅",
          message: "User Demoted to User Successfully",
        });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't promote or demote this user" });
    }
    if (ourUser_Role_Number > 9000 && Object.keys(ourUser_Role)[0] == "Admin") {
      // @ts-ignore
      if (Object.values(role)[0] >= 9000 && Object.keys(role)[0] == "Admin") {
        const AdminId = Math.floor(Math.random() * 1000) + 9000;
        userToPromoteOrDemote[0].servers.find(
          (s: any) => s.server._id.toString() === serverId
        ).role.id = { Admin: AdminId };
        await User.findByIdAndUpdate(userToPromoteOrDemote[0]._id, {
          $set: {
            servers: userToPromoteOrDemote[0].servers,
          },
        });
        const roleId = Math.floor(Math.random() * 1000) + 8000;
        ourUser.servers.find(
          (s: any) => s.server._id.toString() === serverId
        ).role.id = { Manager: roleId };

        await User.findByIdAndUpdate(ourUser._id, {
          $set: {
            servers: ourUser.servers,
          },
        });
        foundServer.users.find(
          (u: any) =>
            u.user.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId.Admin = AdminId;
        foundServer.users.find(
          (u: any) => u.user.toString() === ourUser._id.toString()
        ).roleId.Manager = roleId;

        await foundServer.save();
        return res.status(200).json({
          title: "User Promoted, You are Demoted 😅",
          message:
            "User promoted to Admin Successfully and you are demoted to manager",
        });
      }
      // @ts-ignore
      if (Object.values(role)[0] >= 8000 && Object.keys(role)[0] == "Manager") {
        const isUserAlreadyManager =
          foundServer.users.find(
            (u: any) => u.user.toString() === userId && u.roleId.Manager > 8000
          ) &&
          userToPromoteOrDemote[0].servers.find(
            (s: any) => s.server._id.toString() === serverId
          ).role.id.Manager > 8000;
        if (isUserAlreadyManager) {
          return res.status(400).json({ message: "User is already a manager" });
        }
        if (promoteOrDemoteUser_Role_Number > 8000) {
          return res
            .status(400)
            .json({ message: "The user is already a manager" });
        }
        const managers = foundServer.users.filter(
          (u: any) => u.roleId.Manager > 8000
        );
        if (managers.length == 2) {
          return res
            .status(400)
            .json({ message: "Only 2 managers are allowed" });
        }
        const roleId = Math.floor(Math.random() * 1000) + 8000;
        // console.log(userToPromoteOrDemote[0].servers);
        const serverToUpdateRole = userToPromoteOrDemote[0].servers.find(
          (s: any) => s.server._id.toString() === foundServer._id.toString()
        );
        serverToUpdateRole.role.id = { Manager: roleId };
        console.log(userToPromoteOrDemote[0].servers[0].role);
        foundServer.users.find(
          (u: any) =>
            u.user.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId = { Manager: roleId };
        await foundServer.save();
        await User.findByIdAndUpdate(userToPromoteOrDemote[0]._id, {
          $set: {
            servers: userToPromoteOrDemote[0].servers,
          },
        });
        return res
          .status(200)
          .json({ message: "User promoted to Manager Successfully" });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createServer,
  addToServer,
  getAllServersOfUser,
  getServer,
  updateServer,
  getAllServers,
  deleteServer,
  promoteOrDemoteUser,
};
