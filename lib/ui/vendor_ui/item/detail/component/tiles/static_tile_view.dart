import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../../../../config/ps_colors.dart';

import '../../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../common/ps_bottom_sheet.dart';

class StatisticTileView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider provider =
        Provider.of<ItemDetailProvider>(context);

    final PsValueHolder psValueHolder = Provider.of<PsValueHolder>(context);
    if (!Utils.isOwnerItem(psValueHolder, provider.product)) {
      return const SliverToBoxAdapter(
        child: SizedBox(),
      );
    }

    const Widget _spacingWidget = SizedBox(
      height: PsDimens.space16,
    );

    final Widget _verticalLineWidget = Container(
      color: Theme.of(context).dividerColor,
      width: PsDimens.space1,
      height: PsDimens.space48,
    );

    final Widget _titleWidget = Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: <Widget>[
        Icon(
          Icons.trending_up, //Foundation.graph_bar,
          color:
              Utils.isLightMode(context) ? PsColors.text800 : PsColors.text50,
        ),
        const SizedBox(
          width: PsDimens.space6,
        ),
        Text('statistic_tile__title'.tr,
            style: Theme.of(context).textTheme.titleMedium!.copyWith(
                  color: Utils.isLightMode(context)
                      ? PsColors.text800
                      : PsColors.text50,
                ))
      ],
    );

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(
            vertical: PsDimens.space6, horizontal: PsDimens.space16),
        height: PsDimens.space40,
        child: InkWell(
          highlightColor: PsColors.achromatic100,
          onTap: () {
            PsBottomSheet.show(
                context,
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(PsDimens.space16),
                  decoration: BoxDecoration(
                    color: Utils.isLightMode(context)
                        ? PsColors.text50
                        : PsColors.achromatic700,
                    borderRadius: const BorderRadius.all(
                        Radius.circular(PsDimens.space4)),
                  ),
                  child: Column(
                    children: <Widget>[
                      _titleWidget,
                      const SizedBox(
                        height: PsDimens.space28,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: <Widget>[
                          _IconAndTextWidget(
                              icon: Icons
                                  .visibility_outlined, //SimpleLineIcons.eyeglass,
                              title: '${provider.product.touchCount} ',
                              title2: '${'statistic_tile__views'.tr}',
                              textType: 0),
                          _verticalLineWidget,
                          _IconAndTextWidget(
                              icon: Icons.favorite_border,
                              title: '${provider.product.favouriteCount} ',
                              title2: '${'item_detail__like_count'.tr}',
                              textType: 3),
                        ],
                      ),
                      _spacingWidget
                    ],
                  ),
                ),
                title: 'See your item statistics'.tr);
          },
          child: Ink(
            child: Container(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Text('statistic_tile__title'.tr,
                      style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 18,
                            color: Utils.isLightMode(context)
                                ? PsColors.text500
                                : PsColors.text50,
                          )),
                  const Icon(Icons.chevron_right_outlined)
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _IconAndTextWidget extends StatelessWidget {
  const _IconAndTextWidget({
    Key? key,
    required this.icon,
    required this.title,
    required this.title2,
    required this.textType,
  }) : super(key: key);
  final IconData icon;
  final String title;
  final String title2;
  final int textType;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Text(
          title,
          style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                color: Utils.isLightMode(context)
                    ? PsColors.text800
                    : PsColors.text300,
                fontWeight: FontWeight.w600,
                fontSize: 20.0,
              ),
        ),
        const SizedBox(
          height: PsDimens.space4,
        ),
        Row(
          children: <Widget>[
            Icon(
              icon,
              size: PsDimens.space20,
              color: PsColors.text300,
            ),
            const SizedBox(width: PsDimens.space6),
            Text(
              title2,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                    color: Utils.isLightMode(context)
                        ? PsColors.text800
                        : PsColors.text300,
                    fontWeight: FontWeight.w500,
                    fontSize: 16.0,
                  ),
            ),
          ],
        ),
      ],
    );
  }
}
