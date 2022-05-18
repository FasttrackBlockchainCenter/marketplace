import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import "./styles.scss";
import CollectibleBuyCard from "./CollectibleBuyCard";
import CollectibleAuctionCard from "./CollectibleAuctionCard";
import CollectibleCreatorInfo from "./CollectibleCreatorInfo";
import CollectibleHistory from "./CollectibleHistory";
import { idText } from "typescript";
import API from "../../utils/api.js";
import Axios from "axios";
import { useWallet } from "@binance-chain/bsc-use-wallet";
import Blockies from "react-blockies";
import Loading from "components/Common/Loading";
import BuyResultDialog from "components/Dialogs/BuyResultDialog";
import BidResultDialog from "components/Dialogs/BidResultDialog";
import twitterImg from "assets/img/twitter.png"
import InstagramImg from "assets/img/instagram.png"
import facebookImg from "assets/img/facebook.png"
import likeImg from "assets/img/heart.png"
import eyeImg from "assets/img/eye.png"

const CollectibleDetail = (props) => {
  const { user = {}, collectible_item } = props;
  const [collectible, setCollectible] = useState({});
  const [collectibleItems, setCollectibleItems] = useState("");
  const { id, address } = props.match.params;
  const { account } = useWallet();
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saleStatus, setSaleStatus] = useState(true);

  const [buyResultDialog, setBuyResultDialog] = useState(false);
  const [buyResultStatus, setBuyResultStatus] = useState(true);

  const [bidResultDialog, setBidResultDialog] = useState(false);
  const [bidResultStatus, setBidResultStatus] = useState(true);

  const changeLoading = (status) => {
    setLoading(status);
  };

  const fetchCollectible = async () => {
    let user;
    setLoading(true);
    await Axios.get(
      `${process.env.REACT_APP_API}/account?address=${String(
        address
      ).toLowerCase()}`
    ).then((res) => {
      user = res.data.user;
    });
    await Axios.get(`${process.env.REACT_APP_API}/collectible?tokenID=${id}`)
      .then((response) => {
        setCollectibleItems({ data: response.data.item });
        Axios.get(`${response.data.item.tokenURI}`)
          .then((res) => {
            Axios.get(
              `${process.env.REACT_APP_API}/sale-item?address=${String(
                address
              ).toLowerCase()}`
            )
              .then((resp) => {
                let data = resp.data.items.filter(
                  (t) => t.tokenID === response.data.item.tokenID
                );
                setUserData(user);
                setLoading(false);
                if (data.length == 0) {
                  setSaleStatus(false);
                }

                Axios.get(
                  `${process.env.REACT_APP_API}/account?address=${String(
                    data[0].owner
                  ).toLowerCase()}`
                ).then((resps) => {
                  setCollectible({
                    type: "saleItem",
                    id: id,
                    // title: response.data.item.name,
                    img: response.data.item.imageURL,
                    ifpsURL: response.data.item.tokenURI,
                    contractAddress: response.data.item.contractAddress,
                    creatorAddress: response.data.item.minter,
                    ownerAddress: data[0].owner,
                    ownerAvatar: data[0].ownerAvatar,
                    minterAvatar: data[0].minterAvatar,
                    description: res.data.description,
                    price: Number(res.data.price).toFixed(5),
                    quantity: res.data.amount,
                    rating: res.data.price,
                    creatorName: res.data.name,
                    ownerName: resps.data.user.name
                  });
                })
                  .catch((err) => console.log(err));
              })
              .catch((err) => {
                Axios.get(
                  `${process.env.REACT_APP_API}/auction?address=${String(
                    address
                  ).toLowerCase()}`
                )
                  .then((resp) => {
                    let data = resp.data.items.filter(
                      (t) => t.tokenID === response.data.item.tokenID
                    );
                    setUserData(user);
                    setLoading(false);
                    if (data.length == 0) {
                      setSaleStatus(false);
                    }
    
                    Axios.get(
                      `${process.env.REACT_APP_API}/account?address=${String(
                        data[0].owner
                      ).toLowerCase()}`
                    ).then((resps) => {
    
                      setCollectible({
                        type: "auction",
                        id: id,
                        // title: response.data.item.name,
                        img: response.data.item.imageURL,
                        ifpsURL: response.data.item.tokenURI,
                        contractAddress: response.data.item.contractAddress,
                        creatorAddress: response.data.item.minter,
                        ownerAddress: data[0].owner,
                        ownerAvatar: data[0].ownerAvatar,
                        minterAvatar: data[0].minterAvatar,
                        description: res.data.description,
                        creatorName: res.data.name,
                        ownerName: resps.data.user.name,
                        
                        quantity: data[0].quantity,
                        highestBid: data[0].highestBid,
                        initialPrice: data[0].initialPrice,
                        startTime: data[0].startTime,
                        endTime: data[0].endTime,
                        minBidDifference: data[0].minBidDifference,
                      });
                    })
                      .catch((err) => console.log(err));
                  })
              });
          })
          .catch((err) => console.log(err));
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };

  useEffect(() => {
    fetchCollectible();
  }, []);

  return (
    <div>
      {loading ? (
        <Loading />
      ) : (
        <div className="collectible-detail">
          <div className="collectible-infos container">
            <div className="collectible-img-wrapper">
              <div 
              onClick={() => window.open(collectible.img)}>
                <img
                  className="collectible-img"
                  src={collectible.img}
                  alt={""}
                  onContextMenu={(ev) => {
                    ev.preventDefault();
                  }}
                />
              </div>
            </div>

            <div className="social-bar">
              <div>
                <span className="social-share">Share</span>
                <img className="social-icon" src={twitterImg} />
                <img className="social-icon" src={InstagramImg} />
                <img className="social-icon" src={facebookImg} />
              </div>

              <div>
                <img className="social-icon" src={eyeImg} />
                <img className="social-icon" src={likeImg} />
              </div>
            </div>

            <div className="collectible-info-detail">
              <CollectibleCreatorInfo
                title={collectible.title}
                creatorImg={collectible.minterAvatar}
                creatorName={collectible.creatorName}
                description={collectible.description}
                creatorAddress={collectible.creatorAddress}
              />

              {collectible.type === "auction" ? (
                <CollectibleAuctionCard
                  description={collectible.description}
                  ownerImg={collectible.ownerAvatar}
                  ownerName={collectible.ownerName}
                  id={id}
                  ifpsURL={collectible.ifpsURL}
                  owner={collectible.ownerAddress}
                  contractAddress={collectible.contractAddress}
                  changeLoading={changeLoading}
                  saleStatus={saleStatus}
                  setBidResultDialog={setBidResultDialog}
                  setBidResultStatus={setBidResultStatus}

                  quantity={collectible.quantity}
                  highestBid={collectible.highestBid}
                  initialPrice={collectible.initialPrice}
                  startTime={collectible.startTime}
                  endTime={collectible.endTime}
                  minBidDifference={collectible.minBidDifference}
                />
              ) : (
                <CollectibleBuyCard
                  description={collectible.description}
                  ownerImg={collectible.ownerAvatar}
                  ownerName={collectible.ownerName}
                  sale_price={collectible.price}
                  rating={collectible.rating}
                  quantity={collectible.quantity}
                  id={id}
                  ifpsURL={collectible.ifpsURL}
                  owner={collectible.ownerAddress}
                  contractAddress={collectible.contractAddress}
                  rating={Number(collectible.rating)}
                  changeLoading={changeLoading}
                  saleStatus={saleStatus}
                  setBuyResultDialog={setBuyResultDialog}
                  setBuyResultStatus={setBuyResultStatus}
                />
              )}
            </div>
          </div>
          <div className="collectible-detail-footer">
            {collectible.ownerAvatar ? (
              <img
                className="user-picture"
                src={collectible.ownerAvatar}
                alt=""
              />
            ) : (
              <Blockies
                seed={collectible.ownerAddress ? collectible.ownerAddress : ""}
                size={12}
                scale={10}
                className="user-picture"
              />
            )}
            <p className="user-name">{collectible.name}</p>
            <Link
              className="profile-link"
              to={`/account/${collectible.ownerAddress}`}
            >
              Visit profile
            </Link>
          </div>
        </div>
      )}
      <BuyResultDialog
        show={buyResultDialog}
        closeBuyDlg={() => setBuyResultDialog(false)}
        buyResultStatus={buyResultStatus}
      />
      <BidResultDialog
        show={bidResultDialog}
        closeBidDlg={() => setBidResultDialog(false)}
        bidResultStatus={bidResultStatus}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
  collectible_item: state.collectible,
});

export default connect(mapStateToProps)(withRouter(CollectibleDetail));
