import 'package:flutter/material.dart';

import '../../../../../../config/ps_colors.dart';
import '../../../../../../config/route/route_paths.dart';
import '../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../core/vendor/viewobject/blog.dart';
import '../../../../common/ps_ui_widget.dart';

class BlogSliderItem extends StatelessWidget {
  const BlogSliderItem({required this.blog});
  final Blog blog;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: PsDimens.space16),
      child: Stack(
        children: <Widget>[
          ClipRRect(
            borderRadius: BorderRadius.circular(PsDimens.space4),
            child: Container(
              width: MediaQuery.of(context).size.width,
              height: PsDimens.space180,
              child: PsNetworkImage(
                  photoKey: '',
                  boxfit: BoxFit.cover,
                  defaultPhoto: blog.defaultPhoto,
                  imageAspectRation: PsConst.Aspect_Ratio_3x,
                  onTap: () {
                    Navigator.pushNamed(context, RoutePaths.blogDetail,
                        arguments: blog);
                  }),
            ),
          ),
          Positioned(
            top: PsDimens.space28,
            left: PsDimens.space14,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.start,
              children: <Widget>[
                Container(
                  //height:PsDimens.space100,
                  width: PsDimens.space160,
                  child: Text(
                    blog.name ?? '',
                    textAlign: TextAlign.start,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 3,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w400,
                        color: PsColors.achromatic50),
                  ),
                ),
                const SizedBox(
                  height: 4,
                ),
                InkWell(
                  onTap: () {
                    Navigator.pushNamed(context, RoutePaths.blogDetail,
                        arguments: blog);
                  },
                  child: Container(
                    height: PsDimens.space24,
                    padding: const EdgeInsets.all(PsDimens.space4),
                    decoration: BoxDecoration(
                        color: PsColors.achromatic50,
                        borderRadius: BorderRadius.circular(PsDimens.space8)),
                    child: Center(
                      child: Text(
                        'blog_read_more'.tr,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: PsColors.achromatic900),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
