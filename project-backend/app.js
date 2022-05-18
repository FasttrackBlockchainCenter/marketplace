const fs = require("fs");
const ethers = require("ethers");
const mongoose = require("mongoose");
const User = require("./models/user");
const Like = require("./models/like");
const NFTItem = require("./models/nftitem");
const SaleItem = require("./models/saleitem");
const Auction = require("./models/auction");
const BannedNFT = require("./models/bannednft");
const ERC1155Holding = require("./models/erc1155holding");
const ERC1155Contract = require("./models/erc1155contract");
const ERC1155Distribution = require("./trackNFT");
const TrackNewERC1155 = require("./trackNewNFT");
const TrackSaleItem = require("./trackSaleItem");
const TrackAuctions = require("./trackAuctions");
const { pinFileToIPFS, pinJsonToIPFS } = require("./ipfs");

// const certFileBuf = fs.readFileSync("./rds-combined-ca-bundle.pem");

async function TrackNFTFunction() {
  await mongoose.connect(process.env.MONGO_ADDRESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const users = await User.find({});
  for (let i = 0; i < users.length; i++) {
    users[i].address = String(users[i].address).toLowerCase();
    await users[i].save();
  }

  console.log("Initalizing NFT distribution");
  await ERC1155Distribution();

  console.log("Listening the events");
  TrackNewERC1155();

  console.log("Tracking SaleItem");
  TrackSaleItem();

  if(process.env.AUCTION_CONTRACT_OWNER_PRIVATE_KEY) {
    console.log("Tracking Auction");
    TrackAuctions();
  } else {
    console.log("missing auction contract address env variable")
  }
}
TrackNFTFunction();

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

app.use(express.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.get("/", function (req, res) {
  res.send("Project Marketplace Backend Service");
});

app.get("/health", async function (req, res, next) {
  res.send(true)
})
app.post(
  "/upload-file",
  upload.single("avatar"),
  async function (req, res, next) {
    console.log("upload file")
    try {
      const { IpfsHash } = await pinFileToIPFS(
        req.file.path,
        req.file.filename
      );
      fs.unlinkSync(req.file.path);

      return res.status(200).json({ url: `https://ipfs.io/ipfs/${IpfsHash}` });
    } catch (err) {
      return res.status(500).json({ err });
    }
  }
);

app.post("/upload-json", async function (req, res, next) {
  const { json } = req.body;
  const { IpfsHash } = await pinJsonToIPFS(json);

  return res.status(200).json({ url: `https://ipfs.io/ipfs/${IpfsHash}` });
});

app.get("/sale-item", async function (req, res, next) {
  const { page, address, keyword, searchField, filter } = req.query;
  try {
    let result = [];
    let count = 0;
    if (address) {
      if (searchField) {
        result = await SaleItem.find({ owner: address }).sort({
          [searchField]: filter,
        });
        count = await SaleItem.count({ owner: address }).sort({
          [searchField]: filter,
        });
      } else {
        result = await SaleItem.find({ owner: address });
        count = await SaleItem.count({ owner: address });
      }
    } else {
      result = await SaleItem.find({})
        .sort({ [searchField]: Number(filter) })
        .limit(15)
        .skip(page * 15);
      count = await SaleItem.count({});
    }

    for (let i = 0; i < result.length; i++) {
      const nftItem = await NFTItem.findOne({ tokenID: result[i].tokenID });
      let ownerInfo;
      let minterInfo;
      try {
        ownerItem = await User.findOne({ address: result[i].owner });
        minterInfo = await User.findOne({ address: nftItem.minter });
      } catch (err) {
        console.log("===sale-item===", err);
      }
      result[i] = {
        ...result[i].toSimpleJson(),
        imageURL: nftItem ? nftItem.imageURL : "",
        tokenURI: nftItem ? nftItem.tokenURI : "",
        name: nftItem ? nftItem.name : "",
        minter: nftItem ? nftItem.minter : "",
        ownerAvatar: ownerInfo ? ownerInfo.avatar : "",
        minterAvatar: minterInfo ? minterInfo.avatar : "",
      };
    }
    if (keyword && keyword !== "") {
      result = result.filter((it) =>
        String(it.name).toLowerCase().includes(String(keyword).toLowerCase())
      );
    }

    return res.status(200).json({ items: result, totalCount: count });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err });
  }
});

app.get("/auction", async function (req, res, next) {
  const { page, address, keyword, searchField, filter } = req.query;
  try {
    let result = [];
    let count = 0;
    if (address) {
      if (searchField) {
        result = await Auction.find({ owner: address }).sort({
          [searchField]: filter,
        });
        count = await Auction.count({ owner: address }).sort({
          [searchField]: filter,
        });
      } else {
        result = await Auction.find({ owner: address });
        count = await Auction.count({ owner: address });
      }
    } else {
      result = await Auction.find({})
        .sort({ [searchField]: Number(filter) })
        .limit(15)
        .skip(page * 15);
      count = await Auction.count({});
    }

    for (let i = 0; i < result.length; i++) {
      const nftItem = await NFTItem.findOne({ tokenID: result[i].tokenID });
      let ownerInfo;
      let minterInfo;
      try {
        ownerItem = await User.findOne({ address: result[i].owner });
        minterInfo = await User.findOne({ address: nftItem.minter });
      } catch (err) {
        console.log("===auction===", err);
      }
      result[i] = {
        ...result[i].toSimpleJson(),
        imageURL: nftItem ? nftItem.imageURL : "",
        tokenURI: nftItem ? nftItem.tokenURI : "",
        name: nftItem ? nftItem.name : "",
        minter: nftItem ? nftItem.minter : "",
        ownerAvatar: ownerInfo ? ownerInfo.avatar : "",
        minterAvatar: minterInfo ? minterInfo.avatar : "",
      };
    }
    if (keyword && keyword !== "") {
      result = result.filter((it) =>
        String(it.name).toLowerCase().includes(String(keyword).toLowerCase())
      );
    }

    return res.status(200).json({ items: result, totalCount: count });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err });
  }
});

app.get("/collectible", async function (req, res, next) {
  const { tokenID } = req.query;
  try {
    const nftItem = await NFTItem.findOne({ tokenID: tokenID });
    const result = nftItem.toSimpleJson();

    return res.status(200).json({ item: result });
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.get("/created", async function (req, res, next) {
  const { minter } = req.query;
  try {
    const nftItems = await NFTItem.find({ minter: minter });

    return res.status(200).json({ items: nftItems });
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.get("/holding", async function (req, res, next) {
  const { address, tokenID } = req.query;
  try {
    let holdings;
    if (tokenID)
      holdings = await ERC1155Holding.find({
        holderAddress: address,
        tokenID: tokenID,
      });
    else holdings = await ERC1155Holding.find({ holderAddress: address });

    for (let i = 0; i < holdings.length; i++) {
      const nftItem = await NFTItem.findOne({ tokenID: holdings[i].tokenID });
      const ownerInfo = await User.findOne({
        address: String(address).toLowerCase(),
      });
      const minterInfo = await User.findOne({ address: nftItem.minter });
      holdings[i] = {
        ...holdings[i].toSimpleJson(),
        ...nftItem.toSimpleJson(),
        minterAvatar: minterInfo ? minterInfo.avatar : "",
        ownerAvatar: ownerInfo ? ownerInfo.avatar : "",
        ownerName: ownerInfo ? ownerInfo.name : "",
        minterName: minterInfo ? minterInfo.name : "",
      };
    }

    return res.status(200).json({ items: holdings });
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.get("/user", async function (req, res, next) {
  const { signature } = req.headers;
  let address = null;

  if (signature) {
    address = await ethers.utils.verifyMessage(
      "We ask you to sign this message to prove ownership of this account.",
      signature
    );
    address = address.toLowerCase();
  } else {
    return res.status(401).json({ message: "Authorization Error" });
  }

  if (address) {
    let existingUser = await User.findOne({
      address: address,
    });
    if (existingUser) {
      return res.status(200).json({ user: existingUser.toSimpleJson() });
    } else {
      let newUser = new User();
      newUser.address = address;
      await newUser.save();
      return res.status(200).json({ user: newUser.toSimpleJson() });
    }
  }

  return res.status(200).json({ user: {} });
});

app.get("/account", async function (req, res, next) {
  const { address, keyword } = req.query;

  if (address) {
    let existingUser = await User.findOne({
      address: address,
    });
    if (existingUser) {
      return res.status(200).json({ user: existingUser.toSimpleJson() });
    }
  } else if (keyword || keyword === "") {
    let users = await User.find({});
    if (keyword && keyword !== "") {
      users = users.filter((it) =>
        String(it.name).toLowerCase().includes(String(keyword).toLowerCase())
      );
    }
    users = users.map((it) => it.toPrimaryJson());
    return res.status(200).json({ users: users });
  }

  return res.status(200).json({ user: {} });
});

app.get("/top-sellers", async function (req, res, next) {
  const LIMIT_COUNT = 5;
  let result = await User.find({}).sort({ soldAmount: -1 });
  result = result.map((it) => it.toPrimaryJson()).slice(0, LIMIT_COUNT);

  return res.status(200).json({ items: result });
});

app.post("/user", async function (req, res, next) {
  const { address, avatar, name, coverImage, twitter, instagram, biography } =
    req.body;
  const { signature } = req.headers;

  if (signature) {
    const verifyAddress = await ethers.utils.verifyMessage(
      "We ask you to sign this message to prove ownership of this account.",
      signature
    );
    if (String(verifyAddress).toLowerCase() !== String(address).toLowerCase())
      return res.status(401).json({ message: "Authorization Error" });
  } else {
    return res.status(401).json({ message: "Authorization Error" });
  }

  try {
    let existingUser = await User.findOne({
      address: address.toLowerCase(),
    });
    if (existingUser) {
      existingUser.avatar = avatar;
      existingUser.coverImage = coverImage;
      existingUser.twitter = twitter;
      existingUser.instagram = instagram;
      existingUser.biography = biography;
      existingUser.name = name;
      existingUser.address = address.toLowerCase();
      await existingUser.save();
      return res.status(200).json({ user: existingUser.toSimpleJson() });
    } else {
      let newUser = new User();
      newUser.address = address.toLowerCase();
      newUser.name = name;
      newUser.avatar = avatar;
      newUser.coverImage = coverImage;
      newUser.twitter = twitter;
      newUser.instagram = instagram;
      newUser.biography = biography;
      await newUser.save();
      return res.status(200).json({ user: newUser.toSimpleJson() });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.post("/like", async function (req, res, next) {
  const { address, nft_id } = req.body;
  const { signature } = req.headers;

  if (signature) {
    const verifyAddress = await ethers.utils.verifyMessage(
      "We ask you to sign this message to prove ownership of this account.",
      signature
    );
    if (String(verifyAddress).toLowerCase() !== String(address).toLowerCase())
      return res.status(401).json({ message: "Authorization Error" });
  } else {
    return res.status(401).json({ message: "Authorization Error" });
  }

  try {
    let existingLike = await Like.findOne({
      address: address.toLowerCase(),
      nftitem: nft_id,
    });
    if (!existingLike) {
      let newLike = new Like();
      newLike.address = address.toLowerCase();
      newLike.nftitem = nft_id;
      await newLike.save();
      return res.status(200).json({ like: newLike.toSimpleJson() });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.post("/dislike", async function (req, res, next) {
  const { address, nft_id } = req.body;
  const { signature } = req.headers;

  if (signature) {
    const verifyAddress = await ethers.utils.verifyMessage(
      "We ask you to sign this message to prove ownership of this account.",
      signature
    );
    if (String(verifyAddress).toLowerCase() !== String(address).toLowerCase())
      return res.status(401).json({ message: "Authorization Error" });
  } else {
    return res.status(401).json({ message: "Authorization Error" });
  }

  try {
    let existingLike = await Like.findOne({
      address: address.toLowerCase(),
      nftitem: nft_id,
    });
    if (existingLike) {
      await newLike.remove();
      return res.status(200).json({ response: true });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.get("/like", async function (req, res, next) {
  const { address } = req.query;

  try {
    let likes = await Like.find({
      address: address.toLowerCase(),
    });
    likes = likes.map((it) => it.toSimpleJson());
    if (likes) return res.status(200).json({ likes: likes });
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.listen(process.env.PORT);
