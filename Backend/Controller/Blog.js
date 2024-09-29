const asyncHandler = require("express-async-handler");
const Blogmodel = require("../Model/Blog");
const Usermodel = require("../Model/user");
const jwt = require("jsonwebtoken");
const generateToken  = require("../config/tokenGenerate");
const generateRefreshToken = require("../config/refreshToken");

//create blog
const craeteblog = asyncHandler(async (req, res) => {
  try {
    const newblog = await Blogmodel.create(req.body);
    res.json({ success: true, message: "blog created successfully", newblog });
  } catch (err) {
    throw new Error(err);
  }
});

//update a blog bu it's id
const updateablog = asyncHandler(async (req, res) => {
  try {
    const updatedblog = await Blogmodel.findByIdAndUpdate(
      req.params.blogid,
      req.body
    );
    res.json({
      success: true,
      message: "blog updated successfully",
      updatedblog,
    });
  } catch (err) {
    throw new Error(err);
  }
});

//FIND blog by id
const findblogbyid = asyncHandler(async (req, res) => {
  try {
    const foundblog = await Blogmodel.findByIdAndUpdate(req.params.blogid, {
      $inc: { numViews: 1 },
    });
    res.json({
      success: true,
      message: "successfully found a blog",
      foundblog,
    });
  } catch (err) {
    throw new Error(err);
  }
});
//find all blogs
const findallblogs = asyncHandler(async (req, res) => {
  try {
    const allblogs = await Blogmodel.find();
    res.json({ success: true, message: "all blogs received successfully",allblogs });
  } catch (err) {
    throw new Error(err);
  }
});


//delete a blog

const Deleteblog = asyncHandler(async (req, res) => {
  try {
    const foundblog = await Blogmodel.findByIdAndDelete(req.params.blogid);
    res.json({
      success: true,
      message: "successfully deleted a blog",
      foundblog,
    });
  } catch (err) {
    throw new Error(err);
  }
});


//liking the blog
const likeblogs = asyncHandler(async (req, res) => {
  const { blogid } = req.body;
  try {
      const token = req.headers.authorization.split(" ")[1];
      const tokendata = jwt.decode(token);
      const loginuserid = tokendata.userID;

      const blog = await Blogmodel.findById(blogid);

      if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
      }

      const isLiked = blog.isLiked;
      const alreadyDisLiked = blog.disLikes?.some((userId) => userId.toString() === loginuserid.toString());

      // Handle dislike case
      if (alreadyDisLiked) {
          const updatedBlog = await Blogmodel.findByIdAndUpdate(blogid, {
              $pull: { disLikes: loginuserid },
              isDisLiked: false,
          }, { new: true });
          return res.json(updatedBlog);
      }

      // Handle like/unlike case
      if (isLiked) {
          const updatedBlog = await Blogmodel.findByIdAndUpdate(blogid, {
              $pull: { Likes: loginuserid },
              isLiked: false
          }, { new: true });
          return res.json(updatedBlog);
      } else {
          const updatedBlog = await Blogmodel.findByIdAndUpdate(blogid, {
              $push: { Likes: loginuserid },
              isLiked: true
          }, { new: true });
          return res.json(updatedBlog);
      }
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
  }
});


//disliking the blog

const disliking = asyncHandler(async (req, res) => {
    const { blogid } = req.body;

    try {
        // Extract token and decode it
        const token = req.headers.authorization.split(" ")[1];
        const tokendata = jwt.decode(token);
        const loginuserid = tokendata.userID;

        // Fetch the blog
        const blog = await Blogmodel.findById(blogid);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        const isDisLiked = blog.isDisLiked;
        const alreadyLiked = blog.Likes.some(userId => userId.toString() === loginuserid.toString());

        // If user has already liked the blog, remove their like
        if (alreadyLiked) {
            const updatedBlog = await Blogmodel.findByIdAndUpdate(
                blogid,
                {
                    $pull: { Likes: loginuserid },
                    isLiked: false,
                },
                { new: true }
            );
            return res.json(updatedBlog);
        }

        // If the blog is already disliked, remove the dislike
        if (isDisLiked) {
            const updatedBlog = await Blogmodel.findByIdAndUpdate(
                blogid,
                {
                    $pull: { disLikes: loginuserid },
                    isDisLiked: false,
                },
                { new: true }
            );
            return res.json(updatedBlog);
        } else {
            // If the blog is not disliked yet, add the dislike
            const updatedBlog = await Blogmodel.findByIdAndUpdate(
                blogid,
                {
                    $push: { disLikes: loginuserid },
                    isDisLiked: true,
                },
                { new: true }
            );
            return res.json(updatedBlog);
        }
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});



module.exports = { craeteblog, updateablog, findblogbyid, findallblogs,likeblogs,disliking,Deleteblog };
