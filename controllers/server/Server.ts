const getDataURI = require("../../utils/DataURI");
const User = require("../../models/userModal");
const dotenv = require("dotenv");
dotenv.config();
const cloudinaryV2 = require("cloudinary");
const cloudinary = cloudinaryV2.v2;
const Server = require("../../models/serverModal");

const createServer = async (req: any, res: any) => {
  const { serverName, serverDescription } = req.body;
  const userID = req.user;
  try {
    console.log(req.file);
    if (!serverName)
      return res.status(400).json({ message: "Server name is required" });
    const foundUser = await User.findById(userID);
    if (!foundUser) return res.status(400).json({ message: "User not found" });
    const AdminRoleId = Math.floor(Math.random() * 1000) + 9000;
    if (!req.file)
      return res.status(400).json({ message: "Please provide a file" });

    const image = getDataURI(req.file) as any;

    const image_url = await cloudinary.uploader.upload(image.content, {
      public_id: `CoWorkingSpace/${serverName}/profileImage`,
      overwrite: true,
    });

    const newServer = new Server({
      serverName,
      serverDescription,
      serverProfilePhoto: req.file
        ? image_url.secure_url
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
const addToServer = async (req: any, res: any) => {
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

    const isAdmin = foundServer.users.find((u: any) => {
      if (u.user.toString() === adminId && u.roleId.Admin > 9000) {
        return true;
      }
    });
    console.log("== IS ADMIN ==", isAdmin);
    const isManager = foundServer.users.find((u: any) => {
      if (u.user.toString() === adminId.toString() && u.roleId.Manager) {
        return true;
      }
    });
    console.log("== IS MANAGER ==", isManager);
    if (Boolean(isAdmin) && Boolean(isManager))
      return res.status(403).json({
        title: "You are not Authorized ⚠️",
        message: "You don't have the access to add users to this server",
        type: "error",
      });
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({
        title: "User not found 🔍",
        message:
          "We're unable to find this user, please check the details provided",
        type: "error",
      });
    const userAlreadyExists = foundServer.users.find(
      (u: any) => u.user.toString() == userId
    );
    if (userAlreadyExists)
      return res.status(401).json({
        title: "User already exists",
        message:
          "The user already exists in the server and you cannot add him again ",
        type: "info",
      });
    const roleId = Math.floor(Math.random() * 1000) + 6000;

    foundServer.users.push({
      user: userId,
      roleId: {
        User: roleId,
      },
    });
    await foundServer.save();
    const server = await Server.find({ _id: serverId })
      .populate("users")
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
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
    return res.status(200).json({
      title: `Welcome ${user.displayname} to ${foundServer.serverName} 🔥`,
      message: `${user.displayname} has been added to the server successfully and assigned with the user role`,
      server: server[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      title: "Internal server error 😢",
      message:
        "There is an issue from our side... we're trying to figure it out and fix it",
      type: "error",
    });
  }
};

const getAllServersOfUser = async (req: any, res: any) => {
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

const getServer = async (req: any, res: any) => {
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

const updateServer = async (req: any, res: any) => {
  try {
    const { serverId } = req.params;
    const { serverName, serverDescription } = req.body;
    let image, image_url;
    if (req.file) {
      image = getDataURI(req.file) as any;

      image_url = await cloudinary.uploader.upload(image.content, {
        public_id: `CoWorkingSpace/${serverName}/profileImage`,
        overwrite: true,
      });
    }
    let foundServer = (await Server.find({ _id: serverId })
      .populate("users")
      .populate({
        path: "users",
        populate: {
          path: "user",
          model: "User",
        },
      })) as any;
    foundServer = foundServer[0] as any;
    if (!foundServer) {
      return res.status(400).json({ message: "Server not found" });
    }
    const user = req.user;
    if (
      // @ts-ignore
      !foundServer.users.find((u: any) => {
        return (
          (u.roleId.Admin > 9000 && u.user._id.toString() == user) ||
          (u.roleId.Manager > 8000 && u.user._id.toString() == user)
        );
      })
    ) {
      return res
        .status(400)
        .json({ message: "You are not authorized to update this server" });
    }
    foundServer.serverName = serverName;
    foundServer.serverDescription = serverDescription;
    // @ts-ignore
    if (req.file) foundServer.serverProfilePhoto = image_url.secure_url;
    if (req.file)
      await Server.findByIdAndUpdate(foundServer._id, {
        $set: {
          serverName: foundServer.serverName,
          serverDescription: foundServer.serverDescription,
          serverProfilePhoto: foundServer.serverProfilePhoto,
        },
      });
    else
      await Server.findByIdAndUpdate(foundServer._id, {
        $set: {
          serverName: foundServer.serverName,
          serverDescription: foundServer.serverDescription,
        },
      });
    return res
      .status(200)
      .json({ message: "Server updated successfully", server: foundServer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteServer = async (req: any, res: any) => {
  try {
    const { serverId } = req.params;
    const foundServer = await Server.findById(serverId);
    if (!foundServer) {
      return res.status(400).json({ message: "Server not found" });
    }
    const user = req.user;
    // @ts-ignore
    if (foundServer.admin.toString() !== user) {
      return res
        .status(400)
        .json({ message: "You are not authorized to delete this server" });
    }
    await Server.findByIdAndDelete(serverId);
    const admin = (await User.findById(user)) as any;
    admin.servers = admin.servers.filter(
      (s: { server: string; role: any }) => s.server.toString() !== serverId
    );
    await admin.save();
    return res.status(200).json({ message: "Server deleted successfully" });
  } catch (error) {}
};

const getAllServers = async (req: any, res: any) => {
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

const promoteOrDemoteUser = async (req: any, res: any) => {
  try {
    const { serverId } = req.params;
    const { role, userId } = req.body;
    let foundServer = (await Server.find({ _id: serverId })
      .populate("users")
      .populate({
        path: "users",
        populate: {
          path: "user",
          model: "User",
        },
      })) as any;
    foundServer = foundServer[0] as any;

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
          (u: { user: { _id: string } }) => u.user._id.toString() === userId
        )
      );

    if (!userExists) {
      return res.status(400).json({ message: "User not found in server" });
    }

    const promoteOrDemoteUser_Role = userToPromoteOrDemote[0].servers.find(
      (s: { server: any }) => s.server._id.toString() === serverId
    ).role.id;
    let ourUser = (await User.find({ _id: req.user })
      .populate("servers")
      .populate({
        path: "servers",
        populate: {
          path: "server",
          model: "Server",
        },
      })) as any;
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
    console.log(promoteOrDemoteUser_Role_Number, ourUser_Role_Number);
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
            (u: { user: { _id: string } }) => u.user._id.toString() === userId
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
            u.user._id.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId = { Lead: LeadId };

        await Server.findByIdAndUpdate(foundServer._id, {
          $set: {
            users: foundServer.users,
          },
        });
        return res.status(200).json({
          title: `${userToPromoteOrDemote[0].displayname} Promoted To Lead ✅`,
          message: `${userToPromoteOrDemote[0].displayname} promoted to Lead Successfully `,
          server: foundServer,
        });
      }
      // @ts-ignore
      if (Object.keys(role)[0] == "User" && Object.values(role)[0] < 7000) {
        if (
          foundServer.users.find((u: any) => u.user._id.toString() === userId)
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
            u.user._id.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId = { User: UserId };

        await Server.findByIdAndUpdate(foundServer._id, {
          $set: {
            users: foundServer.users,
          },
        });
        return res.status(200).json({
          title: "User Demoted To User ✅",
          message: "User Demoted to User Successfully",
          server: foundServer,
        });
      }
      // @ts-ignore

      // @ts-ignore
      if (Object.keys(role)[0] == "Remove" && Object.values(role)[0] < 6000) {
        try {
          console.log("REACHED HERE 1");
          userToPromoteOrDemote[0].servers =
            userToPromoteOrDemote[0].servers.filter(
              (s: any) => s.server._id.toString() !== serverId
            );
          console.log("REACHED HERE 2");
          await User.findByIdAndUpdate(userToPromoteOrDemote[0]._id, {
            $set: {
              servers: userToPromoteOrDemote[0].servers,
            },
          });
          console.log(
            "REACHED HERE 3",
            foundServer.users,
            userToPromoteOrDemote
          );
          console.log("REACHED HERE 3.1", foundServer.users.length);

          foundServer.users = foundServer.users.filter(
            (u: any) =>
              u.user._id.toString() !== userToPromoteOrDemote[0]._id.toString()
          );
          console.log("REACHED HERE 3.2", foundServer.users.length);

          console.log("REACHED HERE 4");
          const updatedServer = await Server.findByIdAndUpdate(
            foundServer._id,
            {
              $set: {
                users: foundServer.users,
              },
            }
          );
          console.log("REACHED HERE 5");
          return res.status(200).json({
            title: `${ourUser.displayname} Removed ${userToPromoteOrDemote[0].displayname} From ${foundServer.serverName}✅`,
            message: `${userToPromoteOrDemote[0].displayname} Removed from the server Successfully`,
            removedUser: userToPromoteOrDemote[0],
            server: foundServer,
          });
        } catch (error) {
          console.log("ERROR", error);
        }
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

        if (
          foundServer.users.find(
            (u: any) => u.user._id.toString() === ourUser._id.toString()
          ).roleId.Admin < 9000
        ) {
          return res.status(400).json({
            title: "You cannot promote the user to admin",
            message: "You are not an admin of this server",
            type: "error",
          });
        }

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
            u.user._id.toString() === userToPromoteOrDemote[0]._id.toString()
        ).roleId = { Admin: AdminId };
        foundServer.users.find(
          (u: any) => u.user._id.toString() === ourUser._id.toString()
        ).roleId = { Manager: roleId };

        await Server.findByIdAndUpdate(foundServer._id, {
          $set: {
            users: foundServer.users,
          },
        });
        return res.status(200).json({
          title: `${userToPromoteOrDemote[0].displayname}  Promoted, You are Demoted 😅`,
          message: `${userToPromoteOrDemote[0].displayname}  promoted to Admin Successfully and you are demoted to manager`,
          server: foundServer,
        });
      }
      // @ts-ignore
      if (Object.values(role)[0] >= 8000 && Object.keys(role)[0] == "Manager") {
        try {
          const isUserAlreadyManager =
            foundServer.users.find(
              (u: any) =>
                u.user._id.toString() === userId && u.roleId.Manager > 8000
            ) &&
            userToPromoteOrDemote[0].servers.find(
              (s: any) => s.server._id.toString() === serverId
            ).role.id.Manager > 8000;
          if (isUserAlreadyManager) {
            return res
              .status(400)
              .json({ message: "User is already a manager" });
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
          // console.log("== FOUND Server==", foundServer);

          foundServer.users.find(
            (u: any) =>
              u.user._id.toString() === userToPromoteOrDemote[0]._id.toString()
          ).roleId = { Manager: roleId };
          await foundServer.save();
          await User.findByIdAndUpdate(userToPromoteOrDemote[0]._id, {
            $set: {
              servers: userToPromoteOrDemote[0].servers,
            },
          });
          return res.status(200).json({
            title: `${userToPromoteOrDemote[0].displayname} Promoted To Manager ✅`,
            message: `${userToPromoteOrDemote[0].displayname} promoted to Manager Successfully `,
            server: foundServer,
          });
        } catch (error) {
          return res
            .status(500)
            .json({ message: "PROMOTING TO MANAGER FAILED" });
        }
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
export {
  createServer,
  addToServer,
  getAllServersOfUser,
  getServer,
  updateServer,
  getAllServers,
  deleteServer,
  promoteOrDemoteUser,
};
