import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type PostDocument = HydratedDocument<Post>;

@Schema({ versionKey: false, timestamps: true })
export class Post {
  @Prop({
    required: true,
  })
  description: string;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User'})
  @Prop({
    required: true,
  })
  author: string;
  // @Prop({
  //   type: Date,
  //   default: dateKorea,
  // })
  // Created: Date;

  @Prop({
    default: '',
  })
  parentPost: string;

  @Prop({
    default: [],
  })
  childPosts: string[];
}
const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({
  createdAt: -1,
});

//Full Text Search를 위한 text index
PostSchema.index({ description: 'text' });

//작성자 기준 검색을 위한 compound index
PostSchema.index({ author: 1, _id: 1 });
export { PostSchema };
