class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  search() {
    let keyword = {};

    console.log("queryString", this.queryString);

    // if (this.queryString.category) {
    //     let temp = [];

    //     this.queryString.category.map((ele) => {
    //       temp.push({ category: ele });
    //     });

    //     keyword["$or"] = temp;
    //   keyword["category"] = this.queryString.category;
    // }

    if (this.queryString.category) {
      keyword["categoryId.category"] = {
        $in: this.queryString.category,
      };
    }

    if (this.queryString.status) {
      keyword["editions"] = {
        $elemMatch: { status: this.queryString.status },
      };
    }

    if (this.queryString.price) {
      keyword["editions"] = {
        $elemMatch: {
          price: {
            $gte: this.queryString.price.min,
            $lte: this.queryString.price.max,
          },
        },
      };
    }

    if (this.queryString.media) {
      keyword["mediaType"] = {
        $regex: this.queryString.media,
        $options: "i",
      };
    }

    // if(this.queryString.media){
    //     keyword['avgRate'] = {$gte: 4}
    // }

    console.log("Search Query: ", keyword);

    this.query = this.query.find({ ...keyword });

    return this;
  }
}

module.exports = APIFeatures;
