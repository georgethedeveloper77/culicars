import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../config/route/route_paths.dart';
import '../../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/category.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/holder/intent_holder/product_list_intent_holder.dart';
import '../../../../../../../core/vendor/viewobject/holder/product_parameter_holder.dart';
import '../../../../../../vendor_ui/common/ps_ui_widget.dart';
import '../../../../../../vendor_ui/common/shimmer_item.dart';

class CategoryVerticalListItem extends StatelessWidget {
  const CategoryVerticalListItem(
      {Key? key,
      required this.category,
      required this.animationController,
      required this.animation,
      this.isLoading = false})
      : super(key: key);

  final Category category;
  final AnimationController? animationController;
  final Animation<double>? animation;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final PsValueHolder psValueHolder = Provider.of<PsValueHolder>(context);
    animationController!.forward();
    return AnimatedBuilder(
        animation: animationController!,
        child: GridTile(
          child: Container(
            margin: const EdgeInsets.symmetric(
                horizontal: PsDimens.space6, vertical: PsDimens.space8),
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(
                Radius.circular(4.0),
              ),
              border: Border.all(
                color: Utils.isLightMode(context)
                    ? PsColors.achromatic100
                    : PsColors.achromatic700,
                width: 1.0,
              ),
              color: Utils.isLightMode(context)
                  ? PsColors.achromatic50
                  : PsColors.achromatic800,
            ),
            child: isLoading
                ? const ShimmerItem()
                : InkWell(
                    onTap: () {
                      if (psValueHolder.isShowSubcategory!) {
                        goToSubCategoryList(context, category);
                      } else {
                        goToProductListByCategory(context, category);
                      }
                    },
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        Expanded(
                          child: Container(
                            decoration: const BoxDecoration(
                              borderRadius: BorderRadius.all(
                                  Radius.circular(PsDimens.space8)),
                            ),
                            child: ClipPath(
                              child: PsNetworkImage(
                                // width: PsDimens.space180,
                                //height: PsDimens.space100,
                                imageAspectRation: PsConst.Aspect_Ratio_2x,
                                photoKey: '',
                                defaultPhoto: category.defaultPhoto,
                                boxfit: BoxFit.cover,
                              ),
                              clipper: const ShapeBorderClipper(
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.only(
                                          topLeft:
                                              Radius.circular(PsDimens.space8),
                                          topRight: Radius.circular(
                                              PsDimens.space8)))),
                            ),
                          ),
                        ),
                        const SizedBox(
                          height: PsDimens.space10,
                        ),
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.all(
                              Radius.circular(4.0),
                            ),
                            border: Border.all(
                              color: Utils.isLightMode(context)
                                  ? PsColors.primary50
                                  : PsColors.achromatic700,
                              width: 1.0,
                            ),
                            color: Utils.isLightMode(context)
                                ? PsColors.text100
                                : PsColors.achromatic700,
                          ),
                          margin: const EdgeInsets.only(
                              left: PsDimens.space4, right: PsDimens.space4),
                          padding: const EdgeInsets.only(
                              left: PsDimens.space4, right: PsDimens.space4),
                          child: Row(
                            children: <Widget>[
                              //cat image
                              Container(
                                width: PsDimens.space36,
                                height: PsDimens.space36,
                                child: PsNetworkIcon(
                                  imageAspectRation: PsConst.Aspect_Ratio_1x,
                                  photoKey: '',
                                  defaultIcon: category.defaultIcon,
                                  boxfit: BoxFit.cover,
                                ),
                              ),
                              const SizedBox(
                                width: PsDimens.space8,
                              ),
                              //cat name
                              Flexible(
                                child: Text(
                                  category.catName!,
                                  textAlign: TextAlign.center,
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyLarge!
                                      .copyWith(
                                          color: Utils.isLightMode(context)
                                              ? Theme.of(context).primaryColor
                                              : PsColors.text50,
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(
                          height: PsDimens.space4,
                        ),
                      ],
                    ),
                  ),
          ),
        ),
        builder: (BuildContext context, Widget? child) {
          return FadeTransition(
              opacity: animation!,
              child: Transform(
                transform: Matrix4.translationValues(
                    0.0, 100 * (1.0 - animation!.value), 0.0),
                child: child,
              ));
        });
  }

  void goToSubCategoryList(BuildContext context, Category category) {
    Navigator.pushNamed(context, RoutePaths.subCategoryGrid,
        arguments: category);
  }

  void goToProductListByCategory(BuildContext context, Category category) {
    final ProductParameterHolder productParameterHolder =
        ProductParameterHolder().getLatestParameterHolder();
    productParameterHolder.catId = category.catId;
    Navigator.pushNamed(context, RoutePaths.filterProductList,
        arguments: ProductListIntentHolder(
          appBarTitle: category.catName,
          productParameterHolder: productParameterHolder,
        ));
  }
}
