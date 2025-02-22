import 'package:flutter/material.dart';
import 'package:flutter_linkify/flutter_linkify.dart';
import 'package:provider/provider.dart';
import '../../../../../../../config/ps_colors.dart';

import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../core/vendor/utils/utils.dart';

class DescriptionWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider itemDetailProvider =
        Provider.of<ItemDetailProvider>(context);
    return SliverToBoxAdapter(
      child: itemDetailProvider.product.description == null ||
              itemDetailProvider.product.description == ''
          ? const SizedBox()
          : Padding(
              padding: const EdgeInsets.only(
                  left: PsDimens.space16,
                  // top: PsDimens.space16,
                  right: PsDimens.space16),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'product_detail__product_description'.tr,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium!
                          .copyWith(fontSize: 16, color: PsColors.text50),
                    ),
                    const SizedBox(height: PsDimens.space4),
                    Linkify(
                      onOpen: Utils.linkifyLinkOpen,
                      text: itemDetailProvider.product.description ?? '',
                      style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                            //  height: 1.3,
                            letterSpacing: 0.5,
                            fontWeight: FontWeight.normal,
                            fontSize: 16,
                          ),
                      linkStyle:
                          Theme.of(context).textTheme.bodyMedium!.copyWith(
                                color: PsColors.info700,
                                fontSize: 16,
                              ),
                    ),
                    const SizedBox(
                      height: PsDimens.space2,
                    ),
                  ]),
            ),
    );
  }
}
