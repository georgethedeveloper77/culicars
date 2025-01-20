import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:remixicon/remixicon.dart';

import '../../../../../../../config/route/route_paths.dart';
import '../../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';

class HomeLocationWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final PsValueHolder psValueHolder = Provider.of<PsValueHolder>(context);
    final String locationName = psValueHolder.isSubLocation == PsConst.ONE
        ? (psValueHolder.locationTownshipName.isEmpty ||
                psValueHolder.locationTownshipName ==
                    'product_list__category_all'.tr)
            ? psValueHolder.locactionName!
            : psValueHolder.locationTownshipName
        : psValueHolder.locactionName!;

    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, RoutePaths.itemLocationList);
      },
      child: Padding(
        padding: const EdgeInsets.only(
            left: PsDimens.space10,
            right: PsDimens.space8,
            top: PsDimens.space8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: <Widget>[
            Text(
              locationName,
              textAlign: TextAlign.right,
              style: Theme.of(context)
                  .textTheme
                  .bodyLarge!
                  .copyWith(color: Theme.of(context).primaryColor),
            ),
            const SizedBox(
              width: PsDimens.space6,
            ),
            Icon(Remix.arrow_down_s_line,
                color: Theme.of(context).primaryColor),
          ],
        ),
      ),
    );
  }
}
