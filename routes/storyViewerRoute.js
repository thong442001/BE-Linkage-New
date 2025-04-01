var express = require('express');
var router = express.Router();

const storyViewerController = require("../controllers/storyViewerController")

//checkToken
const checkToken = require("./checkToken");

//add 
//http://localhost:3000/storyViewer/storyViewerOfStory
router.post('/storyViewerOfStory', checkToken, async function (req, res, next) {
  try {
    const { ID_post, ID_user } = req.body;
    const result = await storyViewerController.storyViewerOfStory(ID_post, ID_user);
    if (result.status) {
      res.status(200).json({
        "status": result.status,
        "message": result.message,
        "storyViewers": result?.data
      });
    } else {
      res.status(401).json({
        "status": result.status,
        "message": result.message,
        "error": result?.error,
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


//delete vĩnh viễn
//http://localhost:3000/storyViewer/addStoryViewer_reaction
router.post('/addStoryViewer_reaction', checkToken, async function (req, res, next) {
  try {
    const { ID_post, ID_user, ID_reaction } = req.body;
    const result = await storyViewerController.addStoryViewer_reaction(ID_post, ID_user, ID_reaction);
    if (result.status) {
      res.status(200).json({
        "status": result.status,
        "message": result.message,
        "storyViewer": result.storyViewer
      });
    } else {
      res.status(401).json({
        "status": result.status,
        "message": result.message,
      });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

module.exports = router;
